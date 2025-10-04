import json
import os
from typing import Dict, Any

import numpy as np
import pandas as pd

# Try to import sklearn; fall back gracefully if unavailable
try:
    from sklearn.compose import ColumnTransformer
    from sklearn.metrics import accuracy_score, roc_auc_score, average_precision_score
    from sklearn.model_selection import StratifiedKFold
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import OneHotEncoder, StandardScaler
    from sklearn.ensemble import RandomForestClassifier
    SKLEARN_AVAILABLE = True
except Exception:
    SKLEARN_AVAILABLE = False


DATA_PATH = os.environ.get("DATA_PATH", "personalized_learning_dataset.csv")
OUTPUT_PATH = os.environ.get("OUTPUT_PATH", "results.json")
RANDOM_STATE = int(os.environ.get("SEED", "42"))
CV_FOLDS = int(os.environ.get("CV_FOLDS", "5"))


def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    return df


def basic_validation(df: pd.DataFrame) -> Dict[str, Any]:
    issues = []
    # Expected columns
    expected = {
        'Student_ID','Age','Gender','Education_Level','Course_Name',
        'Time_Spent_on_Videos','Quiz_Attempts','Quiz_Scores','Forum_Participation',
        'Assignment_Completion_Rate','Engagement_Level','Final_Exam_Score',
        'Learning_Style','Feedback_Score','Dropout_Likelihood'
    }
    missing_cols = sorted(list(expected - set(df.columns)))
    if missing_cols:
        issues.append({"type": "missing_columns", "columns": missing_cols})

    # Simple range checks
    if (df.get('Age') is not None) and (df['Age'].min() < 5 or df['Age'].max() > 100):
        issues.append({"type": "age_range_suspicious", "min": float(df['Age'].min()), "max": float(df['Age'].max())})

    # Non-negatives
    for col in ['Time_Spent_on_Videos','Quiz_Attempts','Quiz_Scores','Forum_Participation','Assignment_Completion_Rate','Final_Exam_Score','Feedback_Score']:
        if col in df.columns and (df[col] < 0).any():
            issues.append({"type": "negative_values", "column": col})

    # Duplicates in Student_ID (informational; dataset may have multiple rows per student)
    dup_ratio = 1.0 - df['Student_ID'].nunique() / len(df)
    return {"issues": issues, "duplicate_ratio": dup_ratio}


def compute_engagement_index(df: pd.DataFrame) -> pd.Series:
    # Robust composite using z-scores and equal weights to avoid arbitrary magic numbers
    comp_cols = ['Time_Spent_on_Videos','Quiz_Attempts','Forum_Participation','Assignment_Completion_Rate']
    comp_cols = [c for c in comp_cols if c in df.columns]
    X = df[comp_cols].astype(float).copy()
    # Guard against zero std
    zs = []
    for c in comp_cols:
        mu = X[c].mean()
        sd = X[c].std(ddof=0)
        if sd == 0:
            zs.append(pd.Series(0.0, index=X.index))
        else:
            zs.append((X[c] - mu) / sd)
    zmean = sum(zs) / max(len(zs), 1)
    # Rescale to 0..100 via min-max after clipping to avoid extreme outliers influence
    zc = zmean.clip(zmean.quantile(0.01), zmean.quantile(0.99))
    zmin, zmax = zc.min(), zc.max()
    if zmax - zmin == 0:
        scaled = pd.Series(50.0, index=X.index)
    else:
        scaled = 100 * (zc - zmin) / (zmax - zmin)
    return scaled


def compute_correlations(df: pd.DataFrame, engagement_index: pd.Series) -> Dict[str, Any]:
    res = {"pearson": None, "spearman": None}
    if 'Final_Exam_Score' in df.columns:
        finals = df['Final_Exam_Score'].astype(float)
        pearson = float(np.corrcoef(engagement_index, finals)[0,1])
        # Spearman
        rank_e = engagement_index.rank(method='average')
        rank_f = finals.rank(method='average')
        spearman = float(np.corrcoef(rank_e, rank_f)[0,1])
        res.update({"pearson": pearson, "spearman": spearman})
    return res

# --- Recommendation helpers (data-driven, no hardcoded percentages) ---

def _safe_min_max_scale(series: pd.Series) -> pd.Series:
    s = series.astype(float)
    mn, mx = s.min(), s.max()
    if pd.isna(mn) or pd.isna(mx) or mx - mn == 0:
        return pd.Series(0.5, index=s.index)
    return (s - mn) / (mx - mn)


def _select_sample_students(df: pd.DataFrame, k: int = 5) -> list:
    # Deterministic: choose first k Student_IDs sorted
    ids = sorted(df['Student_ID'].astype(str).unique())
    return ids[:k]


def _build_student_profile_rows(df: pd.DataFrame, engagement_idx: pd.Series, student_ids: list) -> Dict[str, Dict[str, Any]]:
    # Build per-student single-row profiles (first record per student)
    prof = {}
    for sid in student_ids:
        row = df[df['Student_ID'].astype(str) == sid].iloc[0]
        prof[sid] = {
            "Student_ID": sid,
            "Learning_Style": row.get('Learning_Style'),
            "Education_Level": row.get('Education_Level'),
            "Quiz_Scores": float(row.get('Quiz_Scores', float('nan'))),
            "Assignment_Completion_Rate": float(row.get('Assignment_Completion_Rate', float('nan'))),
            "Final_Exam_Score": float(row.get('Final_Exam_Score', float('nan'))),
            "Forum_Participation": float(row.get('Forum_Participation', float('nan'))),
            "Engagement_Score": float(engagement_idx[df.index[df['Student_ID'].astype(str) == sid][0]])
        }
    return prof


def _compute_recommendations(df: pd.DataFrame, profiles: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    # Precompute aggregates by (Course_Name, Learning_Style) and (Course_Name, Education_Level)
    course_style = (
        df.groupby(['Course_Name', 'Learning_Style'])
          .agg(mean_final=('Final_Exam_Score', 'mean'), mean_quiz=('Quiz_Scores', 'mean'),
               mean_assign=('Assignment_Completion_Rate', 'mean'))
          .reset_index()
    )
    course_level = (
        df.groupby(['Course_Name', 'Education_Level'])
          .agg(mean_quiz=('Quiz_Scores', 'mean'))
          .reset_index()
    )
    course_overall = (
        df.groupby(['Course_Name'])
          .agg(mean_final=('Final_Exam_Score', 'mean'), mean_quiz=('Quiz_Scores', 'mean'))
          .reset_index()
    )

    # Global std for scaling distance on quiz
    global_quiz_std = float(df['Quiz_Scores'].std(ddof=0) or 1.0)

    results = {}
    for sid, info in profiles.items():
        ls = info.get('Learning_Style')
        edu = info.get('Education_Level')
        s_quiz = info.get('Quiz_Scores')
        s_final = info.get('Final_Exam_Score')

        # Build component scores per course
        rows = []
        for _, c in course_overall.iterrows():
            cname = c['Course_Name']
            # style score: mean final for this course among same learning style, min-max scaled across courses
            cs = course_style[(course_style['Course_Name'] == cname) & (course_style['Learning_Style'] == ls)]
            style_raw = float(cs['mean_final'].iloc[0]) if len(cs) else float('nan')
            # content score: closeness of student's quiz to course mean quiz within same education level if available; fall back to overall
            cl = course_level[(course_level['Course_Name'] == cname) & (course_level['Education_Level'] == edu)]
            course_quiz = float(cl['mean_quiz'].iloc[0]) if len(cl) else float(c['mean_quiz'])
            # difficulty match: closeness of student's final exam to course mean final (proxy for course level)
            course_final = float(c['mean_final'])
            # engagement potential: course mean assignment rate for same learning style if available
            cs2 = course_style[(course_style['Course_Name'] == cname) & (course_style['Learning_Style'] == ls)]
            mean_assign = float(cs2['mean_assign'].iloc[0]) if len(cs2) else float('nan')

            # Compute component scores in 0..1 with safe handling
            # content: 1 - normalized distance on quiz
            if pd.isna(s_quiz) or pd.isna(course_quiz) or global_quiz_std == 0:
                content_score = 0.5
            else:
                content_score = max(0.0, 1.0 - abs(s_quiz - course_quiz) / (4.0 * global_quiz_std))

            # difficulty: 1 - normalized distance on final exam
            if pd.isna(s_final) or pd.isna(course_final):
                difficulty_score = 0.5
            else:
                # Use global final std for scaling
                final_std = float(df['Final_Exam_Score'].std(ddof=0) or 1.0)
                difficulty_score = max(0.0, 1.0 - abs(s_final - course_final) / (4.0 * final_std))

            # style: will be normalized later across courses using min-max
            # For now store raw style value
            rows.append({
                'Course_Name': cname,
                'style_raw': style_raw,
                'content_score': content_score,
                'difficulty_score': difficulty_score,
                'engagement_score': (mean_assign / 100.0) if not pd.isna(mean_assign) else 0.5
            })

        df_scores = pd.DataFrame(rows)
        # Min-max scale style_raw across the candidate courses
        df_scores['style_score'] = _safe_min_max_scale(df_scores['style_raw'])
        # Weights (transparent in output)
        weights = {"style": 0.35, "content": 0.25, "difficulty": 0.20, "engagement": 0.20}
        df_scores['overall'] = (
            weights['style'] * df_scores['style_score'] +
            weights['content'] * df_scores['content_score'] +
            weights['difficulty'] * df_scores['difficulty_score'] +
            weights['engagement'] * df_scores['engagement_score']
        )
        top = df_scores.sort_values('overall', ascending=False).head(3)
        recs = []
        for _, r in top.iterrows():
            recs.append({
                "title": str(r['Course_Name']),
                "description": f"Recommended based on your {ls} learning style and performance profile.",
                "overallScore": float(round(r['overall'], 4)),
                "styleScore": float(round(r['style_score'], 4)),
                "contentScore": float(round(r['content_score'], 4)),
                "difficultyScore": float(round(r['difficulty_score'], 4)),
                "engagementScore": float(round(r['engagement_score'], 4)),
                "attributions": {
                    "style": float(round(weights['style'] * r['style_score'], 4)),
                    "content": float(round(weights['content'] * r['content_score'], 4)),
                    "difficulty": float(round(weights['difficulty'] * r['difficulty_score'], 4)),
                    "engagement": float(round(weights['engagement'] * r['engagement_score'], 4))
                }
            })
        results[sid] = {"recommendations": recs, "weights": weights}
    return results



def train_dropout_cv(df: pd.DataFrame) -> Dict[str, Any]:
    # Target
    if 'Dropout_Likelihood' not in df.columns:
        return {"error": "Dropout_Likelihood column missing"}
    y = (df['Dropout_Likelihood'].astype(str).str.strip().str.lower() == 'yes').astype(int)

    # Features ONLY pre-outcome; exclude Final_Exam_Score and any engineered score
    num_cols = ['Age','Time_Spent_on_Videos','Quiz_Attempts','Quiz_Scores','Forum_Participation','Assignment_Completion_Rate','Feedback_Score']
    cat_cols = ['Gender','Education_Level','Course_Name','Learning_Style']
    num_cols = [c for c in num_cols if c in df.columns]
    cat_cols = [c for c in cat_cols if c in df.columns]

    X_num = df[num_cols].astype(float) if num_cols else pd.DataFrame(index=df.index)
    X_cat = df[cat_cols].astype(str) if cat_cols else pd.DataFrame(index=df.index)

    if not SKLEARN_AVAILABLE:
        return {
            "warning": "sklearn not available; CV metrics not computed",
            "class_distribution": {"positive": float(y.mean()), "negative": float(1.0 - y.mean())}
        }

    pre = ColumnTransformer([
        ("num", StandardScaler(), num_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols)
    ])
    clf = RandomForestClassifier(n_estimators=300, random_state=RANDOM_STATE, class_weight='balanced', n_jobs=-1)
    pipe = Pipeline(steps=[("pre", pre), ("clf", clf)])

    skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    accs, aucs, pras = [], [], []

    for train_idx, test_idx in skf.split(df, y):
        X_train = df.iloc[train_idx]
        X_test = df.iloc[test_idx]
        y_train = y.iloc[train_idx]
        y_test = y.iloc[test_idx]
        pipe.fit(X_train, y_train)
        y_pred = pipe.predict(X_test)
        accs.append(accuracy_score(y_test, y_pred))
        # AUCs are only valid when both classes present
        if len(np.unique(y_test)) == 2:
            y_proba = pipe.predict_proba(X_test)[:,1]
            aucs.append(roc_auc_score(y_test, y_proba))
            pras.append(average_precision_score(y_test, y_proba))

    metrics = {
        "accuracy_mean": float(np.mean(accs)) if accs else None,
        "accuracy_std": float(np.std(accs)) if accs else None,
        "roc_auc_mean": float(np.mean(aucs)) if aucs else None,
        "roc_auc_std": float(np.std(aucs)) if aucs else None,
        "pr_auc_mean": float(np.mean(pras)) if pras else None,
        "pr_auc_std": float(np.std(pras)) if pras else None,
        "folds": CV_FOLDS,
        "class_distribution": {"positive": float(y.mean()), "negative": float(1.0 - y.mean())}
    }
    return metrics


def build_summary(df: pd.DataFrame, correlations: Dict[str, Any], cv_metrics: Dict[str, Any]) -> Dict[str, Any]:
    stats = {
        "dataset_size": int(len(df)),
        "num_students": int(df['Student_ID'].nunique()) if 'Student_ID' in df.columns else None,
        "num_courses": int(df['Course_Name'].nunique()) if 'Course_Name' in df.columns else None,
        "num_learning_styles": int(df['Learning_Style'].nunique()) if 'Learning_Style' in df.columns else None,
    }
    top_style_name, top_style_pct = None, None
    if 'Learning_Style' in df.columns:
        vc = df['Learning_Style'].value_counts(normalize=True)
        if len(vc) > 0:
            top_style_name = str(vc.index[0])
            top_style_pct = float(vc.iloc[0])
    summary = {
        "stats": stats,
        "top_learning_style": {"name": top_style_name, "pct": top_style_pct},
        "correlations": {
            "engagement_vs_final": correlations
        },
        "dropout_cv": cv_metrics,
        "validation": basic_validation(df)
    }
    return summary


def main():
    df = load_data(DATA_PATH)
    engagement_idx = compute_engagement_index(df)
    corrs = compute_correlations(df, engagement_idx)
    cv_metrics = train_dropout_cv(df)
    out = build_summary(df, corrs, cv_metrics)

    # Build data-driven sample students and recommendations for demo binding
    sample_ids = _select_sample_students(df, k=5)
    # Export additional diagnostics for auditability
    diag_course_style = (
        df.groupby(['Course_Name','Learning_Style'])
          .agg(mean_final=('Final_Exam_Score','mean'),
               mean_quiz=('Quiz_Scores','mean'),
               mean_assign=('Assignment_Completion_Rate','mean'))
          .reset_index()
    )
    out["diagnostics"] = {
        "course_style_means": diag_course_style.to_dict(orient="records")
    }

    sample_profiles = _build_student_profile_rows(df, engagement_idx, sample_ids)
    sample_recs = _compute_recommendations(df, sample_profiles)
    out["sample_students"] = sample_profiles
    out["sample_recommendations"] = sample_recs

    with open(OUTPUT_PATH, "w") as f:
        json.dump(out, f, indent=2)
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

