document.addEventListener('DOMContentLoaded', () => {
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = 'password';

    const getFromStorage = (key, defaultValue) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    };
    const saveToStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    // ADMIN LOGIN PAGE
    if (document.getElementById('adminLoginForm')) {
        const loginForm = document.getElementById('adminLoginForm');
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            if (username === ADMIN_USER && password === ADMIN_PASS) {
                sessionStorage.setItem('isAdmin', 'true');
                window.location.href = 'dashboard.html';
            } else {
                document.getElementById('login-error').classList.remove('hide');
            }
        });
    }

    // ADMIN DASHBOARD PAGE
    if (document.querySelector('.dashboard-container')) {
        if (sessionStorage.getItem('isAdmin') !== 'true') {
            window.location.href = 'admin.html';
            return;
        }

        const settingsForm = document.getElementById('settingsForm');
        const timeSettingInput = document.getElementById('timeSetting');
        const numQuestionsSettingInput = document.getElementById('numQuestionsSetting');
        const settingsSavedMsg = document.getElementById('settings-saved-msg');

        const loadSettings = () => {
            const settings = getFromStorage('quizSettings', { timePerQuestion: 15, numQuestions: 5 });
            timeSettingInput.value = settings.timePerQuestion;
            numQuestionsSettingInput.value = settings.numQuestions;
        };

        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const settings = {
                timePerQuestion: parseInt(timeSettingInput.value),
                numQuestions: parseInt(numQuestionsSettingInput.value)
            };
            saveToStorage('quizSettings', settings);
            settingsSavedMsg.classList.remove('hide');
            setTimeout(() => settingsSavedMsg.classList.add('hide'), 3000);
        });

        const addQuestionForm = document.getElementById('addQuestionForm');
        const questionsList = document.getElementById('questionsList');
        const historyList = document.getElementById('historyList');

        const renderQuestions = () => {
            const questions = getFromStorage('questions', []);
            questionsList.innerHTML = '';
            if (questions.length === 0) {
                 questionsList.innerHTML = '<p>No questions found.</p>';
                 return;
            }
            questions.forEach(q => {
                const item = document.createElement('div');
                item.className = 'item';
                item.innerHTML = `
                    <p>${q.question} <span class="category-tag">${q.category}</span></p>
                    <button class="delete-btn" data-id="${q.id}">Delete</button>
                `;
                questionsList.appendChild(item);
            });
        };

        const renderHistory = () => {
            const history = getFromStorage('quizHistory', []).reverse();
            historyList.innerHTML = '';
            if (history.length === 0) {
                 historyList.innerHTML = '<p>No quiz history found.</p>';
                 return;
            }
            history.forEach(h => {
                const item = document.createElement('div');
                item.className = 'item';
                item.innerHTML = `<p><strong>${h.name}</strong> played <em>${h.category}</em> and scored ${h.score}/${h.total} on ${h.date}</p>`;
                historyList.appendChild(item);
            });
        };

        addQuestionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const questions = getFromStorage('questions', []);
            const options = [
                document.getElementById('option1').value,
                document.getElementById('option2').value,
                document.getElementById('option3').value,
                document.getElementById('option4').value,
            ];
            const newQuestion = {
                id: Date.now(),
                question: document.getElementById('newQuestion').value,
                options: options,
                answer: options[parseInt(document.getElementById('correctAnswer').value)],
                category: document.getElementById('newCategory').value
            };
            questions.push(newQuestion);
            saveToStorage('questions', questions);
            addQuestionForm.reset();
            renderQuestions();
        });
        
        questionsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const questionId = parseInt(e.target.getAttribute('data-id'));
                let questions = getFromStorage('questions', []);
                questions = questions.filter(q => q.id !== questionId);
                saveToStorage('questions', questions);
                renderQuestions();
            }
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            sessionStorage.removeItem('isAdmin');
            window.location.href = 'admin.html';
        });

        loadSettings();
        renderQuestions();
        renderHistory();
    }
});