let currentMode = 'learning'; 
let currentQuestionIndex = 0;
let userAnswers = {};
let sessionStartTime = null;
let timerInterval;

window.bookmarks = new Set(); // store indices of bookmarked questions

function init() {
    switchMode('learning');
}

function toggleDropdown() {
    const dropdown = document.getElementById('study-dropdown');
    const icon = document.getElementById('study-dropdown-icon');
    
    if (dropdown.classList.contains('hidden')) {
        dropdown.classList.remove('hidden');
        dropdown.classList.add('flex');
        icon.classList.add('rotate-180');
    } else {
        dropdown.classList.add('hidden');
        dropdown.classList.remove('flex');
        icon.classList.remove('rotate-180');
    }
    
    // Automatically switch to learning mode when interacting with Study Hub
    if (currentMode !== 'learning') {
        switchMode('learning');
    }
}

function selectSet(setName) {
    if (window.allData[setName]) {
        window.currentSet = setName;
        window.questionsData = window.allData[setName];
        document.getElementById('current-set-label').innerText = setName;
        
        // Reset state for new set
        currentQuestionIndex = 0;
        userAnswers = {};
        window.bookmarks = new Set(); 
        
        // Ensure dropdown is closed
        const dropdown = document.getElementById('study-dropdown');
        const icon = document.getElementById('study-dropdown-icon');
        dropdown.classList.add('hidden');
        dropdown.classList.remove('flex');
        icon.classList.remove('rotate-180');
        
        // Restart the current view
        switchMode(currentMode); 
    }
}

function toggleBookmark(index) {
    if (window.bookmarks.has(index)) {
        window.bookmarks.delete(index);
    } else {
        window.bookmarks.add(index);
    }
    
    if (currentMode === 'learning') {
        renderLearningList();
    } else if (currentMode === 'testing') {
        renderTestQuestion(currentQuestionIndex);
    }
}

function switchMode(mode) {
    currentMode = mode;
    document.getElementById('mode-title').innerText = 
        mode === 'learning' ? 'Study Hub (Learning Mode)' : 
        mode === 'testing' ? 'Active Session (Testing)' : 'Performance Report';
    
    document.getElementById('nav-learning').classList.toggle('text-indigo-700', mode === 'learning');
    document.getElementById('nav-learning').classList.toggle('dark:text-indigo-300', mode === 'learning');
    document.getElementById('nav-learning').classList.toggle('font-bold', mode === 'learning');
    document.getElementById('nav-learning').classList.toggle('bg-indigo-50', mode === 'learning');
    document.getElementById('nav-learning').classList.toggle('dark:bg-indigo-900/20', mode === 'learning');
    
    document.getElementById('nav-testing').classList.toggle('text-indigo-700', mode === 'testing');
    document.getElementById('nav-testing').classList.toggle('dark:text-indigo-300', mode === 'testing');
    document.getElementById('nav-testing').classList.toggle('font-bold', mode === 'testing');
    document.getElementById('nav-testing').classList.toggle('bg-indigo-50', mode === 'testing');
    document.getElementById('nav-testing').classList.toggle('dark:bg-indigo-900/20', mode === 'testing');
    
    // UI state toggles
    if (mode === 'learning') {
        clearInterval(timerInterval);
        document.getElementById('timer-display').innerText = '--:--';
        document.getElementById('finish-btn').classList.add('hidden');
        renderLearningList();
        updateProgress(0, 0);
    } else if (mode === 'testing') {
        currentQuestionIndex = 0;
        userAnswers = {};
        sessionStartTime = Date.now();
        startTimer();
        document.getElementById('finish-btn').classList.remove('hidden');
        renderTestQuestion(currentQuestionIndex);
        updateProgress(0, window.questionsData.length);
    } else if (mode === 'report') {
        clearInterval(timerInterval);
        document.getElementById('finish-btn').classList.add('hidden');
        renderReport();
    }
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const diff = Math.floor((Date.now() - sessionStartTime) / 1000);
        const mins = String(Math.floor(diff / 60)).padStart(2, '0');
        const secs = String(diff % 60).padStart(2, '0');
        document.getElementById('timer-display').innerText = `${mins}:${secs}`;
    }, 1000);
}

// Learning Mode
function renderLearningList() {
    const container = document.getElementById('questions-list');
    
    let html = window.questionsData.map((q, index) => {
        const isBookmarked = window.bookmarks.has(index);
        const optionsHtml = q.options.map((opt, i) => {
            const optionLetter = String.fromCharCode(65 + i);
            const isCorrectOption = q.correct_answers.includes(opt);
            
            let stateClass = "bg-surface-container-low text-on-surface-variant";
            let textClass = "text-on-surface-variant";
            let checkMarkHtml = `<div class="w-8 h-8 rounded-full bg-white text-on-surface flex items-center justify-center font-bold text-sm mr-4 shadow-sm">${optionLetter}</div>`;
            let suffixHtml = "";

            if (isCorrectOption) {
                stateClass = "bg-tertiary-container/10 border-2 border-tertiary/20 shadow-[0_0_25px_rgba(107,255,193,0.15)] pointer-events-none";
                textClass = "text-tertiary font-bold";
                checkMarkHtml = `<div class="w-8 h-8 rounded-full bg-tertiary text-white flex items-center justify-center font-bold text-sm mr-4 shadow-md"><span class="material-symbols-outlined text-sm">check</span></div>`;
                suffixHtml = `<div class="ml-auto px-3 py-1 bg-tertiary-fixed rounded-md text-[10px] font-black uppercase tracking-widest text-on-tertiary-container">Correct Answer</div>`;
            }

            return `
                <div class="group relative flex items-center p-5 rounded-xl transition-all ${stateClass}">
                    ${checkMarkHtml}
                    <span class="text-lg ${textClass}">${opt}</span>
                    ${suffixHtml}
                </div>
            `;
        }).join('');

        return `
            <div class="p-10 rounded-lg bg-surface-container-lowest shadow-[0_20px_50px_rgba(78,69,228,0.04)] border border-primary/5 mb-8 hover:scale-[1.01] transition-transform relative group">
                <div class="flex justify-between items-start mb-8">
                    <span class="px-4 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest">Question ${index + 1} of ${window.questionsData.length}</span>
                    <button onclick="toggleBookmark(${index})" class="p-2 rounded-full hover:bg-surface-variant transition-colors">
                        <span class="material-symbols-outlined cursor-pointer ${isBookmarked ? 'text-tertiary' : 'text-outline/50'} text-3xl" style="${isBookmarked ? 'font-variation-settings:\'FILL\' 1' : 'font-variation-settings:\'FILL\' 0'}">bookmark</span>
                    </button>
                </div>
                <h2 class="text-2xl font-semibold leading-relaxed mb-10 text-on-surface">${q.question}</h2>
                <div class="grid grid-cols-1 gap-4">${optionsHtml}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
    document.getElementById('nav-buttons').classList.add('hidden');
}

// Test Mode
function renderTestQuestion(index) {
    const container = document.getElementById('questions-list');
    if (index < 0 || index >= window.questionsData.length) return;

    const q = window.questionsData[index];
    const isAnswered = userAnswers[index] !== undefined;
    const isBookmarked = window.bookmarks.has(index);

    const optionsHtml = q.options.map((opt, i) => {
        const optionLetter = String.fromCharCode(65 + i);
        const isSelected = userAnswers[index] === i;
        const isCorrectOption = q.correct_answers.includes(opt);
        
        let stateClass = "bg-surface-container-low hover:bg-surface-container text-on-surface-variant cursor-pointer border border-transparent";
        let textClass = "group-hover:text-on-surface";
        let checkMarkHtml = `<div class="w-8 h-8 rounded-full bg-white text-on-surface group-hover:bg-primary group-hover:text-white flex items-center justify-center font-bold text-sm mr-4 shadow-sm transition-all">${optionLetter}</div>`;
        let suffixHtml = "";

        if (isAnswered) {
            if (isSelected && isCorrectOption) {
                stateClass = "bg-tertiary-container/10 border-2 border-tertiary/20 shadow-[0_0_15px_rgba(107,255,193,0.15)] pointer-events-none";
                textClass = "text-tertiary font-bold";
                checkMarkHtml = `<div class="w-8 h-8 rounded-full bg-tertiary text-white flex items-center justify-center font-bold text-sm mr-4 shadow-md"><span class="material-symbols-outlined text-sm">check</span></div>`;
                suffixHtml = `<div class="ml-auto px-3 py-1 bg-tertiary-fixed rounded-md text-[10px] font-black uppercase tracking-widest text-on-tertiary-container">Correct</div>`;
            } else if (isSelected && !isCorrectOption) {
                stateClass = "bg-error-container/10 border-2 border-error/20 shadow-[0_0_15px_rgba(249,115,134,0.15)] pointer-events-none";
                textClass = "text-error font-bold";
                checkMarkHtml = `<div class="w-8 h-8 rounded-full bg-error text-white flex items-center justify-center font-bold text-sm mr-4 shadow-md"><span class="material-symbols-outlined text-sm">close</span></div>`;
                suffixHtml = `<div class="ml-auto px-3 py-1 bg-error-container rounded-md text-[10px] font-black uppercase tracking-widest text-on-error-container">Incorrect</div>`;
            } else if (!isSelected && isCorrectOption) {
                stateClass = "bg-surface border border-tertiary/50 pointer-events-none";
                textClass = "text-tertiary font-semibold";
                checkMarkHtml = `<div class="w-8 h-8 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center font-bold text-sm mr-4"><span class="material-symbols-outlined text-sm">check</span></div>`;
                suffixHtml = `<div class="ml-auto px-3 py-1 bg-tertiary-fixed rounded-md text-[10px] font-black uppercase tracking-widest text-on-tertiary-container">Correct Answer</div>`;
            } else {
                stateClass = "bg-surface-container-low text-on-surface-variant opacity-50 pointer-events-none";
                textClass = "text-on-surface-variant";
            }
        }

        return `
            <div onclick="selectAnswer(${index}, ${i})" class="group relative flex items-center p-5 rounded-xl transition-all ${stateClass}">
                ${checkMarkHtml}
                <span class="text-lg ${textClass}">${opt}</span>
                ${suffixHtml}
            </div>
        `;
    }).join('');

    const html = `
        <div class="p-10 rounded-lg bg-surface-container-lowest shadow-[0_20px_50px_rgba(78,69,228,0.04)] border border-primary/5 transition-all mb-4">
            <div class="flex justify-between items-start mb-8">
                <span class="px-4 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest">Question ${index + 1} of ${window.questionsData.length}</span>
                <button onclick="toggleBookmark(${index})" class="p-2 rounded-full hover:bg-surface-variant transition-colors">
                    <span class="material-symbols-outlined cursor-pointer ${isBookmarked ? 'text-tertiary' : 'text-outline/50'} text-3xl" style="${isBookmarked ? 'font-variation-settings:\'FILL\' 1' : 'font-variation-settings:\'FILL\' 0'}">bookmark</span>
                </button>
            </div>
            <h2 class="text-2xl font-semibold leading-relaxed mb-10 text-on-surface">${q.question}</h2>
            <div class="grid grid-cols-1 gap-4">${optionsHtml}</div>
        </div>
    `;

    container.innerHTML = html;
    
    document.getElementById('nav-buttons').classList.remove('hidden');
    document.getElementById('prev-btn').disabled = index === 0;
    document.getElementById('next-btn').innerText = index === window.questionsData.length - 1 ? 'Finish Test' : 'Next Question';
}

function selectAnswer(qIndex, optIndex) {
    if (userAnswers[qIndex] !== undefined) return; 
    userAnswers[qIndex] = optIndex;
    renderTestQuestion(qIndex);
    updateProgress(Object.keys(userAnswers).length, window.questionsData.length);
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderTestQuestion(currentQuestionIndex);
    }
}

function nextQuestion() {
    if (currentQuestionIndex < window.questionsData.length - 1) {
        currentQuestionIndex++;
        renderTestQuestion(currentQuestionIndex);
    } else {
        finishTest();
    }
}

function finishTest() {
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < window.questionsData.length) {
         if(!confirm(`You have only answered ${answeredCount} out of ${window.questionsData.length} questions. Are you sure you want to finish the test?`)) {
             return;
         }
    }
    switchMode('report');
}

function updateProgress(done, total) {
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    document.getElementById('progress-text').innerText = `${pct}%`;
    document.getElementById('progress-bar').style.width = `${pct}%`;
}

function renderReport() {
    const container = document.getElementById('questions-list');
    document.getElementById('nav-buttons').classList.add('hidden');
    
    let correctCount = 0;
    let questionsReviewHtml = window.questionsData.map((q, index) => {
        const userAnswerIndex = userAnswers[index];
        const isAnswered = userAnswerIndex !== undefined;
        let isCorrect = false;
        
        let userOpt = isAnswered ? q.options[userAnswerIndex] : null;
        if (isAnswered && q.correct_answers.includes(userOpt)) {
            isCorrect = true;
            correctCount++;
        }

        const optionsHtml = q.options.map((opt, i) => {
            const isSelected = userAnswerIndex === i;
            const isCorrectOption = q.correct_answers.includes(opt);
            
            let stateClass = "bg-surface-container-low text-on-surface-variant";
            let checkMarkHtml = `<div class="w-8 h-8 rounded-full bg-white text-on-surface flex items-center justify-center font-bold text-sm mr-4 shadow-sm">${String.fromCharCode(65 + i)}</div>`;
            let textClass = "";
            let suffixHtml = "";

            if (isSelected && isCorrectOption) {
                stateClass = "bg-tertiary-container/10 border-2 border-tertiary/20 shadow-[0_0_15px_rgba(107,255,193,0.15)]";
                textClass = "text-tertiary font-bold";
                checkMarkHtml = `<div class="w-8 h-8 rounded-full bg-tertiary text-white flex items-center justify-center font-bold text-sm mr-4 shadow-md"><span class="material-symbols-outlined text-sm">check</span></div>`;
            } else if (isSelected && !isCorrectOption) {
                stateClass = "bg-error-container/10 border-2 border-error/20 shadow-[0_0_15px_rgba(249,115,134,0.15)]";
                textClass = "text-error font-bold";
                checkMarkHtml = `<div class="w-8 h-8 rounded-full bg-error text-white flex items-center justify-center font-bold text-sm mr-4 shadow-md"><span class="material-symbols-outlined text-sm">close</span></div>`;
                suffixHtml = `<div class="ml-auto px-3 py-1 bg-error-container rounded-md text-[10px] font-black uppercase tracking-widest text-on-error-container">Your Answer</div>`;
            } else if (isCorrectOption) {
                stateClass = "bg-surface border border-tertiary/50";
                textClass = "text-tertiary font-semibold";
                checkMarkHtml = `<div class="w-8 h-8 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center font-bold text-sm mr-4"><span class="material-symbols-outlined text-sm">check</span></div>`;
                suffixHtml = `<div class="ml-auto px-3 py-1 bg-tertiary-fixed rounded-md text-[10px] font-black uppercase tracking-widest text-on-tertiary-container">Correct Answer</div>`;
            }

            return `
                <div class="flex items-center p-5 rounded-xl ${stateClass} transition-all">
                    ${checkMarkHtml}
                    <span class="text-lg ${textClass}">${opt}</span>
                    ${suffixHtml}
                </div>
            `;
        }).join('');

        let headerIcon = isCorrect ? '<span class="material-symbols-outlined text-tertiary text-4xl bg-tertiary-container/20 rounded-full p-2">check_circle</span>' :  '<span class="material-symbols-outlined text-error text-4xl bg-error-container/20 rounded-full p-2">cancel</span>';
        if (!isAnswered) {
             headerIcon = '<span class="material-symbols-outlined text-outline text-4xl bg-surface-variant rounded-full p-2">help</span>';
        }

        return `
            <div class="p-10 rounded-lg bg-surface-container-lowest shadow-sm border border-primary/5 mb-8">
                <div class="flex items-center gap-4 mb-6">
                    ${headerIcon}
                    <div class="flex flex-col">
                        <span class="text-lg font-bold text-on-surface">Question ${index+1}</span>
                        ${!isAnswered ? '<span class="text-xs font-bold uppercase text-outline">Unanswered</span>' : ''}
                    </div>
                </div>
                <h2 class="text-xl font-semibold leading-relaxed mb-6 text-on-surface">${q.question}</h2>
                <div class="grid grid-cols-1 gap-4">${optionsHtml}</div>
            </div>
        `;
    }).join('');

    const pct = Math.round((correctCount / window.questionsData.length) * 100);

    container.innerHTML = `
        <div class="p-12 rounded-lg bg-indigo-900 text-white flex flex-col items-center justify-center mb-12 shadow-[0_20px_50px_rgba(78,69,228,0.2)] relative overflow-hidden group">
            <h2 class="text-3xl font-black mb-2 z-10">Session Performance Summary</h2>
            <div class="text-6xl font-black text-tertiary-fixed my-6 z-10 flex items-baseline gap-2">
                ${pct}<span class="text-4xl">%</span>
            </div>
            <p class="text-indigo-200 text-lg z-10 font-medium">You got <span class="text-white font-bold">${correctCount}</span> out of ${window.questionsData.length} correct.</p>
            <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-primary-container rounded-full blur-3xl opacity-50"></div>
            <div class="absolute -left-10 -top-10 w-48 h-48 bg-tertiary-fixed rounded-full blur-3xl opacity-20"></div>
            
            <button onclick="switchMode('testing')" class="mt-8 z-10 px-8 py-3 bg-white text-indigo-900 rounded-full font-bold hover:scale-105 transition-transform shadow-lg">Retry Session</button>
        </div>
        <h3 class="text-2xl font-bold mb-6 text-on-surface">Detailed Review</h3>
        ${questionsReviewHtml}
    `;
}

init();
