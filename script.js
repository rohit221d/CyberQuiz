document.addEventListener('DOMContentLoaded', () => {
    // --- SHARED FUNCTIONALITY ---
    const getFromStorage = (key, defaultValue) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    };
    const saveToStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    const initializeDefaultQuestions = () => {
        const questions = getFromStorage('questions', []);
        if (questions.length === 0) {
            const defaultQuestions = [
                { id: Date.now() + 1, category: "General", question: "What is the capital of Japan?", options: ["Seoul", "Beijing", "Tokyo", "Bangkok"], answer: "Tokyo" },
                { id: Date.now() + 2, category: "Science", question: "What is the chemical symbol for water?", options: ["O2", "H2O", "CO2", "NaCl"], answer: "H2O" },
                { id: Date.now() + 3, category: "Sports", question: "Which country won the first-ever FIFA World Cup in 1930?", options: ["Argentina", "Brazil", "Uruguay", "Italy"], answer: "Uruguay" },
                { id: Date.now() + 4, category: "Sports", question: "In which sport would you perform a 'slam dunk'?", options: ["Volleyball", "Basketball", "Tennis", "Badminton"], answer: "Basketball" },
                { id: Date.now() + 5, category: "Science", question: "What planet is known as the 'Morning Star' or 'Evening Star'?", options: ["Mars", "Venus", "Jupiter", "Mercury"], answer: "Venus" }
            ];
            saveToStorage('questions', defaultQuestions);
        }
    };
    initializeDefaultQuestions();

    // --- INDEX PAGE LOGIC ---
    if (document.querySelector('.category-selection')) {
        const playerNameInput = document.getElementById('playerName');
        const categoryButtons = document.querySelectorAll('.category-btn');

        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                const playerName = playerNameInput.value.trim();
                const category = button.getAttribute('data-category');
                if (playerName) {
                    sessionStorage.setItem('currentPlayer', playerName);
                    sessionStorage.setItem('currentCategory', category);
                    window.location.href = 'quiz.html';
                } else {
                    alert('Please enter your name to start!');
                }
            });
        });
    }

    // --- QUIZ PAGE LOGIC ---
    if (document.querySelector('.quiz-container')) {
        const playerName = sessionStorage.getItem('currentPlayer');
        const category = sessionStorage.getItem('currentCategory');
        if (!playerName || !category) {
            window.location.href = 'index.html';
            return;
        }

        const questionTextEl = document.getElementById('questionText');
        const answerButtonsEl = document.getElementById('answer-buttons');
        const nextBtn = document.getElementById('nextBtn');
        const resultsEl = document.getElementById('results');
        const scoreEl = document.getElementById('score');
        const timerTextEl = document.getElementById('timer-text');
        const timerProgressEl = document.querySelector('.timer-progress');
        const summaryEl = document.getElementById('summary');
        const viewSummaryBtn = document.getElementById('viewSummaryBtn');
        
        document.getElementById('playerNameDisplay').textContent = playerName;

        const settings = getFromStorage('quizSettings', { timePerQuestion: 15, numQuestions: 5 });
        const TIME_LIMIT = settings.timePerQuestion;

        const allQuestions = getFromStorage('questions', []);
        const filteredQuestions = allQuestions.filter(q => q.category === category);
        const numToShow = Math.min(settings.numQuestions, filteredQuestions.length);
        let questions = filteredQuestions.sort(() => Math.random() - 0.5).slice(0, numToShow);
        
        let currentQuestionIndex = 0;
        let score = 0;
        let quizSessionData = [];
        
        let timeLeft = TIME_LIMIT;
        let timerInterval;
        const CIRCLE_LENGTH = 2 * Math.PI * 45; 
        timerProgressEl.style.strokeDasharray = CIRCLE_LENGTH;

        const startTimer = () => {
            timeLeft = TIME_LIMIT;
            timerTextEl.textContent = timeLeft;
            timerProgressEl.style.strokeDashoffset = 0;
            clearInterval(timerInterval);

            timerInterval = setInterval(() => {
                timeLeft--;
                timerTextEl.textContent = timeLeft;
                const progress = timeLeft / TIME_LIMIT;
                timerProgressEl.style.strokeDashoffset = CIRCLE_LENGTH * (1 - progress);
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    timeUp();
                }
            }, 1000);
        };

        const timeUp = () => {
            const timeTaken = TIME_LIMIT;
            quizSessionData.push({
                question: questions[currentQuestionIndex].question,
                userAnswer: 'Timed Out',
                correctAnswer: questions[currentQuestionIndex].answer,
                time: timeTaken,
                isCorrect: false
            });

            showCorrectAnswer();
            Array.from(answerButtonsEl.children).forEach(button => button.disabled = true);
            nextBtn.classList.remove('hide');
        };

        const startQuiz = () => {
            if (questions.length === 0) {
                questionTextEl.innerText = `No questions available for the ${category} category. Please ask an admin to add some!`;
                document.querySelector('.quiz-header').classList.add('hide');
                return;
            }
            currentQuestionIndex = 0;
            score = 0;
            quizSessionData = [];
            resultsEl.classList.add('hide');
            summaryEl.classList.add('hide');
            showQuestion();
        };

        const showQuestion = () => {
            resetState();
            if (currentQuestionIndex >= questions.length) {
                showScore();
                return;
            }
            const currentQuestion = questions[currentQuestionIndex];
            questionTextEl.innerText = currentQuestion.question;
            scoreEl.innerText = score;

            currentQuestion.options.forEach(option => {
                const button = document.createElement('button');
                button.innerText = option;
                button.classList.add('btn');
                button.addEventListener('click', selectAnswer);
                answerButtonsEl.appendChild(button);
            });
            startTimer();
        };

        const resetState = () => {
            nextBtn.classList.add('hide');
            while (answerButtonsEl.firstChild) {
                answerButtonsEl.removeChild(answerButtonsEl.firstChild);
            }
        };

        const selectAnswer = (e) => {
            clearInterval(timerInterval);
            const selectedBtn = e.target;
            const isCorrect = selectedBtn.innerText === questions[currentQuestionIndex].answer;
            const timeTaken = TIME_LIMIT - timeLeft;
            
            quizSessionData.push({
                question: questions[currentQuestionIndex].question,
                userAnswer: selectedBtn.innerText,
                correctAnswer: questions[currentQuestionIndex].answer,
                time: timeTaken,
                isCorrect: isCorrect
            });

            if (isCorrect) {
                score++;
                selectedBtn.classList.add('correct');
            } else {
                selectedBtn.classList.add('incorrect');
                showCorrectAnswer();
            }
            Array.from(answerButtonsEl.children).forEach(button => button.disabled = true);
            nextBtn.classList.remove('hide');
        };

        const showCorrectAnswer = () => {
            Array.from(answerButtonsEl.children).forEach(button => {
                if(button.innerText === questions[currentQuestionIndex].answer) {
                    button.classList.add('correct');
                }
            });
        };

        const showScore = () => {
            resetState();
            
            // Corrected code: hide specific elements, not the whole container
            document.querySelector('.quiz-header').classList.add('hide');
            questionTextEl.classList.add('hide');
            
            document.getElementById('finalPlayerName').innerText = playerName;
            document.getElementById('finalScore').innerText = score;
            document.getElementById('totalQuestions').innerText = questions.length;
            resultsEl.classList.remove('hide');

            const history = getFromStorage('quizHistory', []);
            history.push({ name: playerName, score, total: questions.length, category, date: new Date().toLocaleString() });
            saveToStorage('quizHistory', history);
        };
        
        const renderSummary = () => {
            const summaryListEl = document.getElementById('summaryList');
            summaryListEl.innerHTML = '';

            quizSessionData.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.classList.add('summary-item', item.isCorrect ? 'correct' : 'incorrect');

                let answerDetails;
                if (item.userAnswer === 'Timed Out') {
                    answerDetails = `<p>You ran out of time! Correct answer was: <strong>${item.correctAnswer}</strong></p>`;
                } else if (item.isCorrect) {
                    answerDetails = `<p>You correctly answered: <strong>${item.userAnswer}</strong></p>`;
                } else {
                    answerDetails = `<p>You answered: <strong>${item.userAnswer}</strong> (Correct: <strong>${item.correctAnswer}</strong>)</p>`;
                }
                
                itemEl.innerHTML = `
                    <p class="question-text">${item.question}</p>
                    ${answerDetails}
                    <p class="details">Time taken: ${item.time} seconds</p>
                `;
                summaryListEl.appendChild(itemEl);
            });

            resultsEl.classList.add('hide');
            summaryEl.classList.remove('hide');
        };

        nextBtn.addEventListener('click', () => {
            currentQuestionIndex++;
            showQuestion();
        });

        viewSummaryBtn.addEventListener('click', renderSummary);

        startQuiz();
    }
});