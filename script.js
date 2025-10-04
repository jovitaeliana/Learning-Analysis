function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    const activeLink = Array.from(document.querySelectorAll('.nav-link')).find(link => {
        return link.getAttribute('onclick') && link.getAttribute('onclick').includes(tabId);
    });

    if (activeLink) {
        activeLink.classList.add('active');
    }
}

let students = {};
let resultsData = null;

function buildStudentsFromResults(data) {
    const sampleStudents = data?.sample_students || {};
    const sampleRecs = data?.sample_recommendations || {};
    const map = {};
    const ids = Object.keys(sampleStudents).sort();

    ids.forEach((sid, idx) => {
        const p = sampleStudents[sid];
        const weights = sampleRecs[sid]?.weights || {
            style: 0.35,
            content: 0.25,
            difficulty: 0.20,
            engagement: 0.20
        };

        const recs = (sampleRecs[sid]?.recommendations || []).map(r => ({
            title: r.title,
            description: r.description,
            overallScore: (r.overallScore ?? 0).toFixed(2),
            styleScore: (r.styleScore ?? 0).toFixed(2),
            contentScore: (r.contentScore ?? 0).toFixed(2),
            difficultyScore: (r.difficultyScore ?? 0).toFixed(2),
            engagementScore: (r.engagementScore ?? 0).toFixed(2),
            attributions: r.attributions || {
                style: (weights.style * (parseFloat(r.styleScore) || 0)).toFixed(3),
                content: (weights.content * (parseFloat(r.contentScore) || 0)).toFixed(3),
                difficulty: (weights.difficulty * (parseFloat(r.difficultyScore) || 0)).toFixed(3),
                engagement: (weights.engagement * (parseFloat(r.engagementScore) || 0)).toFixed(3)
            }
        }));

        map[String(idx + 1)] = {
            id: `Student ${sid}`,
            learningStyle: p.Learning_Style || '—',
            educationLevel: p.Education_Level || '—',
            quizScore: (p.Quiz_Scores != null ? `${Math.round(p.Quiz_Scores)}%` : '—'),
            assignmentRate: (p.Assignment_Completion_Rate != null ? `${Math.round(p.Assignment_Completion_Rate)}%` : '—'),
            finalScore: (p.Final_Exam_Score != null ? `${Math.round(p.Final_Exam_Score)}%` : '—'),
            forumParticipation: (p.Forum_Participation != null ? `${Math.round(p.Forum_Participation)} posts` : '—'),
            engagementScore: (p.Engagement_Score != null ? p.Engagement_Score.toFixed(1) : '—'),
            recommendations: recs,
            weights
        };
    });

    return map;
}

function refreshDiagVisibility() {
    const toggle = document.getElementById('toggle-diag');
    const show = !!(toggle && toggle.checked);
    document.querySelectorAll('.diag-details').forEach(el => {
        el.style.display = show ? 'block' : 'none';
    });
}

function updateStudentProfile(student) {
    document.getElementById('student-id').textContent = student.id;
    document.getElementById('learning-style').textContent = student.learningStyle;
    document.getElementById('education-level').textContent = student.educationLevel;
    document.getElementById('quiz-score').textContent = student.quizScore;
    document.getElementById('assignment-rate').textContent = student.assignmentRate;
    document.getElementById('final-score').textContent = student.finalScore;
    document.getElementById('forum-participation').textContent = student.forumParticipation;
    document.getElementById('engagement-score').textContent = student.engagementScore;

    const recommendationCards = document.getElementById('recommendation-cards');
    recommendationCards.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'row mt-4';
    header.innerHTML = `
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <i class="bi bi-stars me-2"></i>Personalized Course Recommendations
                </div>
                <div class="card-body">
                    <p class="lead mb-0">
                        Based on ${student.learningStyle} learning style and ${student.engagementScore} engagement score,
                        our ML-powered system recommends the following courses:
                    </p>
                </div>
            </div>
        </div>
    `;
    recommendationCards.appendChild(header);

    student.recommendations.forEach((rec, index) => {
        const card = document.createElement('div');
        card.className = 'row mt-3';
        card.innerHTML = `
            <div class="col-12">
                <div class="card recommendation-card">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-lg-7">
                                <h4>#${index + 1}: ${rec.title}</h4>
                                <p class="mb-3">${rec.description}</p>

                                <div class="diag-details" style="display: none;">
                                    <h6 class="mt-3 mb-2"><i class="bi bi-gear me-2"></i>Technical Details</h6>
                                    <div class="row g-2">
                                        <div class="col-6">
                                            <small class="text-muted">Model Weights:</small>
                                            <div class="small">
                                                Style: ${student.weights?.style ?? '0.35'} |
                                                Content: ${student.weights?.content ?? '0.25'} |
                                                Difficulty: ${student.weights?.difficulty ?? '0.20'} |
                                                Engagement: ${student.weights?.engagement ?? '0.20'}
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <small class="text-muted">Weighted Contributions:</small>
                                            <div class="small">
                                                Style: ${rec.attributions?.style ?? '-'} |
                                                Content: ${rec.attributions?.content ?? '-'} |
                                                Difficulty: ${rec.attributions?.difficulty ?? '-'} |
                                                Engagement: ${rec.attributions?.engagement ?? '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-5">
                                <div class="mb-4 text-center">
                                    <div style="font-size: 2.5rem; font-weight: 700; color: var(--primary);">
                                        ${rec.overallScore}
                                    </div>
                                    <div class="text-muted small">Overall Match Score</div>
                                </div>

                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <small>Learning Style Match</small>
                                        <small><strong>${rec.styleScore}</strong></small>
                                    </div>
                                    <div class="progress">
                                        <div class="progress-bar bg-primary" style="width: ${parseFloat(rec.styleScore) * 100}%"></div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <small>Content Relevance</small>
                                        <small><strong>${rec.contentScore}</strong></small>
                                    </div>
                                    <div class="progress">
                                        <div class="progress-bar bg-info" style="width: ${parseFloat(rec.contentScore) * 100}%"></div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <small>Difficulty Match</small>
                                        <small><strong>${rec.difficultyScore}</strong></small>
                                    </div>
                                    <div class="progress">
                                        <div class="progress-bar bg-success" style="width: ${parseFloat(rec.difficultyScore) * 100}%"></div>
                                    </div>
                                </div>

                                <div class="mb-0">
                                    <div class="d-flex justify-content-between mb-1">
                                        <small>Engagement Potential</small>
                                        <small><strong>${rec.engagementScore}</strong></small>
                                    </div>
                                    <div class="progress">
                                        <div class="progress-bar bg-warning" style="width: ${parseFloat(rec.engagementScore) * 100}%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        recommendationCards.appendChild(card);
    });

    refreshDiagVisibility();
}

function updateDashboardMetrics(data) {
    const stats = data?.stats || {};
    const dropout = data?.dropout_cv || {};
    const topStyle = data?.top_learning_style || {};
    const correlations = data?.correlations?.engagement_vs_final || {};

    if (document.getElementById('hero-students')) {
        document.getElementById('hero-students').textContent = (stats.num_students || 10000).toLocaleString();
    }
    if (document.getElementById('hero-courses')) {
        document.getElementById('hero-courses').textContent = stats.num_courses || 5;
    }
    if (document.getElementById('hero-accuracy')) {
        document.getElementById('hero-accuracy').textContent = dropout.accuracy_mean
            ? `${(dropout.accuracy_mean * 100).toFixed(1)}%`
            : '80.4%';
    }

    if (document.getElementById('dataset-size')) {
        document.getElementById('dataset-size').textContent = (stats.dataset_size || 10000).toLocaleString();
    }
    if (document.getElementById('course-count')) {
        document.getElementById('course-count').textContent = stats.num_courses || 5;
    }
    if (document.getElementById('learning-style-count')) {
        document.getElementById('learning-style-count').textContent = stats.num_learning_styles || 4;
    }
    if (document.getElementById('dropout-rate')) {
        const dropoutRate = dropout.class_distribution?.positive;
        document.getElementById('dropout-rate').textContent = dropoutRate
            ? `${(dropoutRate * 100).toFixed(1)}%`
            : '19.6%';
    }
    if (document.getElementById('top-style-pct')) {
        document.getElementById('top-style-pct').textContent = topStyle.pct
            ? `${(topStyle.pct * 100).toFixed(0)}%`
            : '—';
    }
    if (document.getElementById('top-style-name')) {
        document.getElementById('top-style-name').textContent = topStyle.name || 'Reading/Writing';
    }

    if (document.getElementById('corr-pearson-display')) {
        document.getElementById('corr-pearson-display').textContent =
            correlations.pearson !== undefined ? correlations.pearson.toFixed(3) : '—';
    }
    if (document.getElementById('corr-spearman-display')) {
        document.getElementById('corr-spearman-display').textContent =
            correlations.spearman !== undefined ? correlations.spearman.toFixed(3) : '—';
    }

    if (document.getElementById('model-accuracy')) {
        document.getElementById('model-accuracy').textContent = dropout.accuracy_mean
            ? `${(dropout.accuracy_mean * 100).toFixed(1)}%`
            : '—';
    }
    if (document.getElementById('model-roc')) {
        document.getElementById('model-roc').textContent = dropout.roc_auc_mean
            ? dropout.roc_auc_mean.toFixed(3)
            : '—';
    }
    if (document.getElementById('model-pr')) {
        document.getElementById('model-pr').textContent = dropout.pr_auc_mean
            ? dropout.pr_auc_mean.toFixed(3)
            : '—';
    }
    if (document.getElementById('model-folds')) {
        document.getElementById('model-folds').textContent = dropout.folds || 5;
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log('KINEX Learning Analytics Platform initializing...');

    try {
        const response = await fetch('results.json', { cache: 'no-store' });
        if (response.ok) {
            resultsData = await response.json();
            console.log('Results data loaded successfully');

            updateDashboardMetrics(resultsData);

            students = buildStudentsFromResults(resultsData);
            console.log(`Loaded ${Object.keys(students).length} students`);

            const selectEl = document.getElementById('student-select');
            if (selectEl) {
                selectEl.innerHTML = '';
                Object.keys(students).forEach(key => {
                    const opt = document.createElement('option');
                    opt.value = key;
                    opt.textContent = students[key].id;
                    selectEl.appendChild(opt);
                });

                if (Object.keys(students).length > 0) {
                    selectEl.value = '1';
                }
            }

            if (students['1']) {
                updateStudentProfile(students['1']);
            }
        } else {
            console.error('Failed to load results.json');
        }
    } catch (error) {
        console.error('Error loading results.json:', error);
    }

    const toggle = document.getElementById('toggle-diag');
    if (toggle) {
        toggle.addEventListener('change', refreshDiagVisibility);
    }

    const studentForm = document.getElementById('student-select-form');
    if (studentForm) {
        studentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const studentId = document.getElementById('student-select').value;
            if (students[studentId]) {
                updateStudentProfile(students[studentId]);

                document.getElementById('recommendations-container').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }

    showTab('overview');

    console.log('KINEX initialization complete');
});
