(() => {
    const dailyGoalInput = document.getElementById('dailyGoalInput');
    const cupButtons = document.querySelectorAll('.cup-button');
    const progressCircle = document.getElementById('progressCircle');
    const intakeValue = document.getElementById('intakeValue');
    const intakeLabel = document.getElementById('intakeLabel');
    const historyList = document.getElementById('historyList');
    const btnNotify = document.getElementById('btnNotify');
    const popExcitement = document.getElementById('popExcitement');
    document.querySelector('h1').style.cssText = 'font-size: 2.4rem; color: #0277bd; text-shadow: 0 0 6px rgba(2,119,189,0.7); margin-bottom: 1rem;';
    document.querySelector('.container').style.maxWidth = '600px';
    document.querySelector('.container').style.backgroundColor = 'rgba(255,255,255,0.98)';


    const radius = 54;
    const circumference = 2 * Math.PI * radius;

    const resetBtn = document.getElementById('resetBtn');

    resetBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to reset your daily water intake and history?")) {
            intake = 0;
            history = [];
            saveData();
            updateProgress();
            renderHistory();
        }
    });


    let dailyGoal = parseInt(dailyGoalInput.value) || 2000;
    let intake = 0;
    let history = [];

    function loadData() {
        const savedGoal = localStorage.getItem('dailyGoal');
        const savedIntake = localStorage.getItem('intake');
        const savedDate = localStorage.getItem('lastIntakeDate');
        const savedHistory = localStorage.getItem('intakeHistory');
        const today = (new Date()).toISOString().slice(0, 10);

        if (savedGoal && !isNaN(parseInt(savedGoal))) {
            dailyGoal = parseInt(savedGoal);
            dailyGoalInput.value = dailyGoal;
        }

        if (savedDate === today && savedIntake) {
            intake = parseInt(savedIntake);
        } else {
            intake = 0;
            localStorage.setItem('lastIntakeDate', today);
            localStorage.setItem('intake', '0');
        }

        if (savedHistory) {
            history = JSON.parse(savedHistory);
        } else {
            history = [];
        }
    }

    function saveData() {
        localStorage.setItem('dailyGoal', dailyGoal);
        localStorage.setItem('intake', intake);
        localStorage.setItem('lastIntakeDate', (new Date()).toISOString().slice(0, 10));
        localStorage.setItem('intakeHistory', JSON.stringify(history));
    }

    function updateProgress() {
        const percent = Math.min(intake / dailyGoal, 1);
        const dashoffset = circumference - (circumference * percent);
        progressCircle.style.strokeDashoffset = dashoffset;
        intakeValue.textContent = `${intake} ml`;
        intakeLabel.textContent = `of ${dailyGoal} ml`;
    }

    function addHistoryEntry(amount) {
        const today = (new Date()).toISOString().slice(0, 10);
        let entry = history.find(h => h.date === today);
        if (entry) {
            entry.amount += amount;
        } else {
            entry = { date: today, amount: amount };
            history.unshift(entry);
        }
        if (history.length > 7) {
            history.pop();
        }
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.textContent = 'No history yet.';
            return;
        }
        history.forEach(entry => {
            const li = document.createElement('div');
            li.classList.add('history-item');
            const date = new Date(entry.date);
            li.textContent = `${date.toDateString()}: ${entry.amount} ml`;
            historyList.appendChild(li);
        });
    }

    // Show excitement pop-up for goal exceeded
    function showExcitement() {
        popExcitement.setAttribute('aria-hidden', 'false');
        popExcitement.classList.add('show');
        setTimeout(() => {
            popExcitement.classList.remove('show');
            popExcitement.setAttribute('aria-hidden', 'true');
        }, 2000);
    }

    cupButtons.forEach(button => {
        button.addEventListener('click', () => {
            const amount = parseInt(button.getAttribute('data-amount'));
            if (intake + amount > dailyGoal) {
                showExcitement();
            }
            intake += amount;
            addHistoryEntry(amount);
            saveData();
            updateProgress();
            renderHistory();
        });
    });

    dailyGoalInput.addEventListener('change', () => {
        let val = parseInt(dailyGoalInput.value);
        if (isNaN(val) || val < 500) val = 500;
        if (val > 10000) val = 10000;
        dailyGoal = val;
        dailyGoalInput.value = val;
        saveData();
        updateProgress();
    });

    // Reset intake automatically at midnight
    function setupMidnightReset() {
        const now = new Date();
        const msToMidnight = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
            0, 0, 0, 0
        ) - now;

        setTimeout(() => {
            intake = 0;
            saveData();
            updateProgress();
            renderHistory();
            setupMidnightReset();
        }, msToMidnight + 5000);
    }

    // Notification permissions and scheduling
    function requestNotificationPermission() {
        if (!('Notification' in window)) {
            alert("This browser does not support notifications.");
            return;
        }
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                btnNotify.textContent = 'Reminders Enabled';
                scheduleNotification();
            }
        });
    }

    function scheduleNotification() {
        if (Notification.permission !== 'granted') return;

        function notify() {
            new Notification('Water Intake Reminder', {
                body: 'Remember to drink water for your health 💧',
                icon: 'https://icons.iconarchive.com/icons/icons8/windows-8/256/Health-Water-icon.png'
            });
        }

        function scheduleNext() {
            const now = new Date();
            let next = new Date(now.getTime());
            next.setMinutes(0, 0, 0);
            next.setHours(now.getHours() + 2);
            if (next.getHours() > 20) {
                next.setDate(next.getDate() + 1);
                next.setHours(8);
            }
            const delay = next - now;
            setTimeout(() => {
                notify();
                scheduleNext();
            }, delay);
        }

        scheduleNext();
    }

    btnNotify.addEventListener('click', () => {
        requestNotificationPermission();
    });

    function init() {
        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = circumference;
        loadData();
        updateProgress();
        renderHistory();
        setupMidnightReset();
        if (Notification.permission === 'granted') {
            btnNotify.textContent = 'Reminders Enabled';
        }
    }

    init();
})();