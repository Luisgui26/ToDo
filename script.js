// Seleção de elementos do DOM
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const pendingCountEl = document.getElementById('pending-count');
const completedCountEl = document.getElementById('completed-count');
const errorMessageEl = document.getElementById('error-message');

// ==========================================
// ESTADO (State Management Pattern)
// ==========================================
const state = {
    tasks: [],
    loading: false
};

// ==========================================
// INICIALIZAÇÃO E STORAGE
// ==========================================

// Carregar tarefas do localStorage ao iniciar
function loadTasks() {
    try {
        const savedTasks = localStorage.getItem('todo_tasks');
        if (savedTasks) {
            state.tasks = JSON.parse(savedTasks);
        }
    } catch (e) {
        console.error("Erro ao carregar tarefas", e);
    }
    renderTasks();
}

// Salvar tarefas no localStorage
function saveTasks() {
    localStorage.setItem('todo_tasks', JSON.stringify(state.tasks));
    updateStats();
}

// ==========================================
// FUNÇÕES PRINCIPAIS
// ==========================================

// Formatar data e hora atual ("DD/MM/AAAA - HH:MM")
function getFormattedDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
}

// Validação de Formulário
function validateInput(text) {
    if (!text) {
        showError('A tarefa não pode estar vazia.');
        return false;
    }
    if (text.length > 100) {
        showError('A tarefa deve ter menos de 100 caracteres.');
        return false;
    }
    clearError();
    return true;
}

function showError(msg) {
    errorMessageEl.textContent = msg;
    errorMessageEl.style.display = 'block';
    taskInput.classList.add('invalid');
    taskInput.setAttribute('aria-invalid', 'true');
}

function clearError() {
    errorMessageEl.style.display = 'none';
    taskInput.classList.remove('invalid');
    taskInput.setAttribute('aria-invalid', 'false');
}

// Adicionar uma nova tarefa
function addTask() {
    const text = taskInput.value.trim();
    if (!validateInput(text)) return;

    const newTask = {
        id: Date.now().toString(), // ID único baseado no timestamp
        text: text,
        createdAt: getFormattedDate(),
        completed: false
    };

    state.tasks.push(newTask);
    saveTasks();
    
    // Limpar o input e renderizar
    taskInput.value = '';
    taskInput.focus();
    renderTasks();
}

// Editar uma tarefa existente
function editTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    // Acessibilidade: Salvar foco atual
    const previousFocus = document.activeElement;

    const newText = prompt('Edite sua tarefa:', task.text);
    if (newText !== null) {
        const trimmed = newText.trim();
        if (trimmed !== '' && trimmed.length <= 100) {
            task.text = trimmed;
            saveTasks();
            renderTasks();
        }
    }
    
    // Restaurar foco
    if (previousFocus) previousFocus.focus();
}

// Deletar uma tarefa
function deleteTask(id) {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        if (taskElement) {
            taskElement.classList.add('removing');
            
            setTimeout(() => {
                state.tasks = state.tasks.filter(t => t.id !== id);
                saveTasks();
                renderTasks();
            }, 300);
        }
    }
}

// Alternar status de conclusão
function toggleComplete(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

// Atualizar estatísticas (contadores) e estado vazio
function updateStats() {
    const completedTasks = state.tasks.filter(t => t.completed).length;
    const pendingTasks = state.tasks.length - completedTasks;

    pendingCountEl.textContent = `Pendentes: ${pendingTasks}`;
    completedCountEl.textContent = `Concluídas: ${completedTasks}`;

    if (state.tasks.length === 0) {
        emptyState.style.display = 'block';
        emptyState.setAttribute('aria-hidden', 'false');
        taskList.style.display = 'none';
        taskList.setAttribute('aria-hidden', 'true');
    } else {
        emptyState.style.display = 'none';
        emptyState.setAttribute('aria-hidden', 'true');
        taskList.style.display = 'flex';
        taskList.setAttribute('aria-hidden', 'false');
    }
}

// ==========================================
// RENDERIZAÇÃO
// ==========================================

// Renderizar toda a lista na tela
function renderTasks() {
    taskList.innerHTML = ''; 

    state.tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', task.id);
        // Acessibilidade: Navegação por teclado (focus management)
        li.tabIndex = 0; 
taskInput.addEventListener('input', clearError);

        li.setAttribute('role', 'option');

        li.innerHTML = `
            <div class="task-content">
                <span class="task-text">${task.text}</span>
                <span class="task-date">Criado em: ${task.createdAt}</span>
            </div>
            <div class="task-actions">
                <button class="btn-icon btn-complete" onclick="toggleComplete('${task.id}')" aria-label="${task.completed ? 'Desmarcar tarefa' : 'Concluir tarefa'}" title="${task.completed ? 'Desmarcar' : 'Concluir'}">
                    <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                </button>
                <button class="btn-icon btn-edit" onclick="editTask('${task.id}')" aria-label="Editar tarefa" title="Editar" ${task.completed ? 'disabled aria-disabled="true" style="opacity:0.5; cursor:not-allowed;"' : ''}>
                    <i class="fas fa-pen"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteTask('${task.id}')" aria-label="Excluir tarefa" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Navegação por setas (Acessibilidade)
        li.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' && index < state.tasks.length - 1) {
                e.preventDefault();
                li.nextElementSibling?.focus();
            } else if (e.key === 'ArrowUp' && index > 0) {
                e.preventDefault();
                li.previousElementSibling?.focus();
            }
        });

        taskList.appendChild(li);
    });

    updateStats();
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// Clique no botão adicionar
addBtn.addEventListener('click', addTask);

// Pressionar Enter no campo de texto
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', loadTasks);