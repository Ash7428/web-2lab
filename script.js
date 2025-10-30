document.addEventListener('DOMContentLoaded', () => {
    const TASKS_STORAGE_KEY = 'todoTasks';

    // === Создание структуры страницы ===
    const container = document.createElement('div');
    container.className = 'container';
    document.body.appendChild(container);

    const header = document.createElement('h1');
    header.textContent = 'To-Do List';
    container.appendChild(header);

    // Форма добавления
    const form = document.createElement('form');
    form.className = 'form';
    container.appendChild(form);

    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    form.appendChild(inputGroup);

    const taskInput = document.createElement('input');
    taskInput.type = 'text';
    taskInput.placeholder = 'Введите название задачи';
    taskInput.required = true;
    inputGroup.appendChild(taskInput);

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.required = true;
    inputGroup.appendChild(dateInput);

    const addButton = document.createElement('button');
    addButton.type = 'submit';
    addButton.textContent = 'Добавить';
    form.appendChild(addButton);

    // Фильтры
    const filters = document.createElement('div');
    filters.className = 'filters';
    container.appendChild(filters);

    const statusFilter = document.createElement('select');
    ['all|Все', 'pending|В работе', 'completed|Выполнено'].forEach(pair => {
        const [value, text] = pair.split('|');
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        statusFilter.appendChild(option);
    });
    filters.appendChild(statusFilter);

    const sortSelect = document.createElement('select');
    ['asc|По дате ↑', 'desc|По дате ↓'].forEach(pair => {
        const [value, text] = pair.split('|');
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        sortSelect.appendChild(option);
    });
    filters.appendChild(sortSelect);

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Поиск по названию';
    filters.appendChild(searchInput);

    // Список задач
    const taskList = document.createElement('ul');
    taskList.className = 'task-list';
    container.appendChild(taskList);

    // === Загрузка задач ===
    let tasks = loadTasks();
    renderTasks();

    // === Добавление задачи ===
    form.addEventListener('submit', e => {
        e.preventDefault();
        const name = taskInput.value.trim();
        const date = dateInput.value;
        if (name && date) {
            tasks.push({
                id: Date.now(),
                name,
                date,
                completed: false
            });
            saveTasks();
            renderTasks();
            taskInput.value = '';
            dateInput.value = '';
        }
    });

    // === Фильтры и поиск ===
    statusFilter.addEventListener('change', renderTasks);
    sortSelect.addEventListener('change', renderTasks);
    searchInput.addEventListener('input', renderTasks);

    // === Drag & Drop ===
    taskList.addEventListener('dragstart', e => {
        if (e.target.classList.contains('task-item')) {
            e.target.classList.add('dragging');
        }
    });

    taskList.addEventListener('dragend', e => {
        if (e.target.classList.contains('task-item')) {
            e.target.classList.remove('dragging');
        }
    });

    taskList.addEventListener('dragover', e => {
        e.preventDefault();
        const dragging = document.querySelector('.dragging');
        const afterElement = getDragAfterElement(taskList, e.clientY);
        if (afterElement == null) {
            taskList.appendChild(dragging);
        } else {
            taskList.insertBefore(dragging, afterElement);
        }
    });

    taskList.addEventListener('drop', () => {
        const newOrder = Array.from(taskList.children).map(li =>
            tasks.find(t => t.id == li.dataset.id)
        );
        tasks = newOrder;
        saveTasks();
    });

    function getDragAfterElement(container, y) {
        const items = [...container.querySelectorAll('.task-item:not(.dragging)')];
        return items.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // === Рендер задач ===
    function renderTasks() {
        while (taskList.firstChild) {
            taskList.removeChild(taskList.firstChild);
        }

        let filtered = tasks.filter(task => {
            const search = searchInput.value.toLowerCase();
            return !search || task.name.toLowerCase().includes(search);
        });

        if (statusFilter.value !== 'all') {
            const isCompleted = statusFilter.value === 'completed';
            filtered = filtered.filter(t => t.completed === isCompleted);
        }

        filtered.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortSelect.value === 'asc' ? dateA - dateB : dateB - dateA;
        });

        filtered.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.dataset.id = task.id;
            li.draggable = true;
            if (task.completed) li.classList.add('completed');

            // Чекбокс
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => {
                task.completed = checkbox.checked;
                saveTasks();
                renderTasks();
            });
            li.appendChild(checkbox);

            // Контент
            const content = document.createElement('div');
            content.className = 'task-content';

            const textSpan = document.createElement('span');
            textSpan.className = 'task-text';
            textSpan.textContent = task.name;
            content.appendChild(textSpan);

            const dateSpan = document.createElement('span');
            dateSpan.className = 'task-date';
            dateSpan.textContent = task.date;
            content.appendChild(dateSpan);

            li.appendChild(content);

            // Кнопки
            const actions = document.createElement('div');
            actions.className = 'task-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Изменить';
            editBtn.addEventListener('click', () => {
                const newName = prompt('Новое название:', task.name);
                const newDate = prompt('Новая дата (ГГГГ-ММ-ДД):', task.date);
                if (newName !== null && newDate !== null) {
                    task.name = newName.trim() || task.name;
                    task.date = newDate || task.date;
                    saveTasks();
                    renderTasks();
                }
            });
            actions.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Удалить';
            deleteBtn.addEventListener('click', () => {
                tasks = tasks.filter(t => t.id !== task.id);
                saveTasks();
                renderTasks();
            });
            actions.appendChild(deleteBtn);

            li.appendChild(actions);
            taskList.appendChild(li);
        });
    }

    // === LocalStorage ===
    function saveTasks() {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    }

    function loadTasks() {
        const data = localStorage.getItem(TASKS_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }
});