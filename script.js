// Tab Functionality
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href').includes(tabId)) {
            link.classList.add('active');
        }
    });
}

const students = {
    '1': {
        id: 'Student S00001',
        learningStyle: 'Visual',
        educationLevel: 'High School',
        quizScore: '67%',
        assignmentRate: '89%',
        finalScore: '51%',
        forumParticipation: '2 posts',
        engagementScore: '57.8',
        recommendations: [
            {
                title: 'Python Basics',
                description: 'This course aligns with your Visual learning style, provides a good foundation to strengthen your knowledge.',
                overallScore: '0.64',
                styleScore: '0.63',
                contentScore: '0.50',
                difficultyScore: '0.82',
                engagementScore: '0.64',
                dataInsight: 'Visual learners with your profile show 18% higher completion rates in this course.'
            },
            {
                title: 'Data Science',
                description: 'This course aligns with your Visual learning style, has an intermediate difficulty level appropriate for your performance.',
                overallScore: '0.62',
                styleScore: '0.66',
                contentScore: '0.50',
                difficultyScore: '0.84',
                engagementScore: '0.44',
                dataInsight: 'Students with similar assessment profiles improved their scores by 23% in this course.'
            },
            {
                title: 'AI Ethics',
                description: 'This course has an intermediate difficulty level appropriate for your performance.',
                overallScore: '0.53',
                styleScore: '0.50',
                contentScore: '0.50',
                difficultyScore: '0.84',
                engagementScore: '0.24',
                dataInsight: 'This course offers diverse learning formats that accommodate different learning styles.'
            }
        ]
    },
    '2': {
        id: 'Student S00002',
        learningStyle: 'Reading/Writing',
        educationLevel: 'Undergraduate',
        quizScore: '64%',
        assignmentRate: '94%',
        finalScore: '92%',
        forumParticipation: '0 posts',
        engagementScore: '57.6',
        recommendations: [
            {
                title: 'Machine Learning',
                description: 'This course aligns with your Reading/Writing learning style, has an intermediate difficulty level appropriate for your performance.',
                overallScore: '0.59',
                styleScore: '0.63',
                contentScore: '0.50',
                difficultyScore: '0.75',
                engagementScore: '0.40',
                dataInsight: 'Reading/Writing learners with strong performance show 91% satisfaction with this course.'
            },
            {
                title: 'Data Science',
                description: 'This course aligns with your Reading/Writing learning style, has an intermediate difficulty level appropriate for your performance.',
                overallScore: '0.58',
                styleScore: '0.62',
                contentScore: '0.50',
                difficultyScore: '0.75',
                engagementScore: '0.40',
                dataInsight: 'Students with similar profiles improved their quiz scores by 12% in this course.'
            },
            {
                title: 'Deep Learning',
                description: 'This course offers an appropriate challenge given your strong performance history.',
                overallScore: '0.57',
                styleScore: '0.50',
                contentScore: '0.50',
                difficultyScore: '0.92',
                engagementScore: '0.40',
                dataInsight: 'Top-performing students often choose this course to further enhance their skills.'
            }
        ]
    },
    '3': {
        id: 'Student S00003',
        learningStyle: 'Reading/Writing',
        educationLevel: 'Undergraduate',
        quizScore: '55%',
        assignmentRate: '67%',
        finalScore: '45%',
        forumParticipation: '2 posts',
        engagementScore: '44.0',
        recommendations: [
            {
                title: 'Machine Learning',
                description: 'This course aligns with your Reading/Writing learning style, has an intermediate difficulty level appropriate for your performance.',
                overallScore: '0.60',
                styleScore: '0.63',
                contentScore: '0.50',
                difficultyScore: '0.78',
                engagementScore: '0.44',
                dataInsight: 'Students with similar performance profiles improved by 25% after taking this course.'
            },
            {
                title: 'Data Science',
                description: 'This course aligns with your Reading/Writing learning style, has an intermediate difficulty level appropriate for your performance.',
                overallScore: '0.60',
                styleScore: '0.62',
                contentScore: '0.50',
                difficultyScore: '0.78',
                engagementScore: '0.44',
                dataInsight: 'This course provides gradual progression, ideal for building foundational knowledge.'
            },
            {
                title: 'AI Ethics',
                description: 'This course has an intermediate difficulty level appropriate for your performance.',
                overallScore: '0.52',
                styleScore: '0.50',
                contentScore: '0.50',
                difficultyScore: '0.78',
                engagementScore: '0.24',
                dataInsight: 'Discussion-based components may help increase your forum participation.'
            }
        ]
    },
    '4': {
        id: 'Student S00004',
        learningStyle: 'Visual',
        educationLevel: 'Undergraduate',
        quizScore: '65%',
        assignmentRate: '60%',
        finalScore: '59%',
        forumParticipation: '43 posts',
        engagementScore: '69.9',
        recommendations: [
            {
                title: 'Machine Learning',
                description: 'This course aligns with your Visual learning style, has an intermediate difficulty level appropriate for your performance, includes collaboration components that match your engagement preferences.',
                overallScore: '0.68',
                styleScore: '0.65',
                contentScore: '0.50',
                difficultyScore: '0.92',
                engagementScore: '0.74',
                dataInsight: "Your high forum participation suggests you'd benefit from this course's collaborative elements."
            },
            {
                title: 'AI Ethics',
                description: 'This course has an intermediate difficulty level appropriate for your performance, includes collaboration components that match your engagement preferences.',
                overallScore: '0.65',
                styleScore: '0.50',
                contentScore: '0.50',
                difficultyScore: '0.92',
                engagementScore: '0.94',
                dataInsight: 'Students with high forum participation excel in this discussion-oriented course.'
            },
            {
                title: 'Python Basics',
                description: 'This course aligns with your Visual learning style, provides a good foundation to strengthen your knowledge.',
                overallScore: '0.61',
                styleScore: '0.63',
                contentScore: '0.50',
                difficultyScore: '0.74',
                engagementScore: '0.54',
                dataInsight: 'Visual learners show 27% higher retention of programming concepts in this course.'
            }
        ]
    },
    '5': {
        id: 'Student S00005',
        learningStyle: 'Visual',
        educationLevel: 'Postgraduate',
        quizScore: '59%',
        assignmentRate: '88%',
        finalScore: '93%',
        forumParticipation: '34 posts',
        engagementScore: '85.1',
        recommendations: [
            {
                title: 'Data Science',
                description: 'This course aligns with your Visual learning style, has an intermediate difficulty level appropriate for your performance, includes collaboration components that match your engagement preferences.',
                overallScore: '0.67',
                styleScore: '0.66',
                contentScore: '0.50',
                difficultyScore: '0.74',
                engagementScore: '0.92',
                dataInsight: 'Postgraduate visual learners consistently rate this course highly (4.8/5).'
            },
            {
                title: 'Machine Learning',
                description: 'This course aligns with your Visual learning style, has an intermediate difficulty level appropriate for your performance, includes collaboration components that match your engagement preferences.',
                overallScore: '0.67',
                styleScore: '0.65',
                contentScore: '0.50',
                difficultyScore: '0.74',
                engagementScore: '0.92',
                dataInsight: "Your strong performance and engagement profile suggests you'll excel in this course."
            },
            {
                title: 'Deep Learning',
                description: 'This course offers an appropriate challenge given your strong performance history, includes collaboration components that match your engagement preferences.',
                overallScore: '0.65',
                styleScore: '0.50',
                contentScore: '0.50',
                difficultyScore: '0.93',
                engagementScore: '0.92',
                dataInsight: 'High-performing postgraduate students typically select this as their next course.'
            }
        ]
    }
};

function updateStudentProfile(student) {
    document.getElementById('student-id').textContent = student.id;
    document.getElementById('learning-style').textContent = student.learningStyle;
    document.getElementById('education-level').textContent = student.educationLevel;
    document.getElementById('quiz-score').textContent = student.quizScore;
    document.getElementById('assignment-rate').textContent = student.assignmentRate;
    document.getElementById('final-score').textContent = student.finalScore;
    document.getElementById('forum-participation').textContent = student.forumParticipation;
    document.getElementById('engagement-score').textContent = student.engagementScore;
    
    // Clear existing recommendations
    const recommendationCards = document.getElementById('recommendation-cards');
    recommendationCards.innerHTML = '';
    
    // lead text
    const leadText = document.createElement('div');
    leadText.className = 'row';
    leadText.innerHTML = `
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <i class="bi bi-lightbulb text-white me-2"></i> Personalized Course Recommendations
                </div>
                <div class="card-body">
                    <p class="lead mb-4">
                        Based on ${student.learningStyle} learning style, ${student.educationLevel} education level, and ${student.engagementScore} engagement score, 
                        we recommend:
                    </p>
                </div>
            </div>
        </div>
    `;
    recommendationCards.appendChild(leadText);
    
    // recommendation cards
    student.recommendations.forEach((rec, index) => {
        const card = document.createElement('div');
        card.className = 'row mt-3';
        card.innerHTML = `
            <div class="col-12">
                <div class="card recommendation-card">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <h4>#${index+1}: ${rec.title}</h4>
                                <p>${rec.description}</p>
                                <div class="data-insight-sm mt-3">
                                    <h6><i class="bi bi-graph-up-arrow"></i> Data Insight</h6>
                                    <p>${rec.dataInsight}</p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="d-flex flex-column">
                                    <div class="mb-3 text-center">
                                        <div class="score-value">${rec.overallScore}</div>
                                        <div class="score-label">Overall Match</div>
                                    </div>
                                    
                                    <div class="progress mb-2">
                                        <div class="progress-bar bg-primary" role="progressbar" 
                                             style="width: ${parseFloat(rec.styleScore)*100}%"></div>
                                    </div>
                                    <div class="d-flex justify-content-between mb-2">
                                        <small>Learning Style Match</small>
                                        <small>${rec.styleScore}</small>
                                    </div>
                                    
                                    <div class="progress mb-2">
                                        <div class="progress-bar bg-info" role="progressbar" 
                                             style="width: ${parseFloat(rec.contentScore)*100}%"></div>
                                    </div>
                                    <div class="d-flex justify-content-between mb-2">
                                        <small>Content Relevance</small>
                                        <small>${rec.contentScore}</small>
                                    </div>
                                    
                                    <div class="progress mb-2">
                                        <div class="progress-bar bg-success" role="progressbar" 
                                             style="width: ${parseFloat(rec.difficultyScore)*100}%"></div>
                                    </div>
                                    <div class="d-flex justify-content-between mb-2">
                                        <small>Difficulty Match</small>
                                        <small>${rec.difficultyScore}</small>
                                    </div>
                                    
                                    <div class="progress mb-2">
                                        <div class="progress-bar bg-warning" role="progressbar" 
                                             style="width: ${parseFloat(rec.engagementScore)*100}%"></div>
                                    </div>
                                    <div class="d-flex justify-content-between mb-2">
                                        <small>Engagement Potential</small>
                                        <small>${rec.engagementScore}</small>
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
}

// Select student profile in demo
function selectStudent(studentId) {
    document.getElementById('student-select').value = studentId;
    updateStudentProfile(students[studentId]);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Handle demo form submission
    const studentForm = document.getElementById('student-select-form');
    studentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const studentId = document.getElementById('student-select').value;
        updateStudentProfile(students[studentId]);
    });
    
    // Initialize with first student
    updateStudentProfile(students['1']);
    
    // Show overview tab by default
    showTab('overview');
});