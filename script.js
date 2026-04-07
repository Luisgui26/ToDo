// Seleção de elementos do DOM
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const pendingCountEl = document.getElementById('pending-count');
const completedCountEl = document.getElementById('completed-count');
const errorMessageEl = document.getElementById('error-message');

// Elementos do Modal de Edição
const editModal = document.getElementById('edit-modal');
const editTaskInput = document.getElementById('edit-task-input');
const saveEditBtn = document.getElementById('save-edit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const editErrorMessageEl = document.getElementById('edit-error-message');

// Elementos do Modal de Exclusão
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

// ==========================================
// ESTADO (State Management Pattern)
// ==========================================
const state = {
    tasks: [],
    loading: false,
    editingTaskId: null,
    deletingTaskId: null,
    previousFocus: null
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

// Helper: Capitalizar primeira letra
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Adicionar uma nova tarefa
function addTask() {
    if (state.tasks.length >= 10) {
        showError('Você atingiu o limite máximo de 10 tarefas.');
        return;
    }

    const text = taskInput.value.trim();
    if (!validateInput(text)) return;

    const newTask = {
        id: Date.now().toString(), // ID único baseado no timestamp
        text: capitalizeFirstLetter(text),
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

// Editar uma tarefa existente (Abre o Modal)
function editTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    // Acessibilidade: Salvar foco atual
    state.previousFocus = document.activeElement;
    state.editingTaskId = id;

    // Preencher e limpar erros anteriores
    editTaskInput.value = task.text;
    editErrorMessageEl.style.display = 'none';
    editTaskInput.classList.remove('invalid');

    // Mostrar modal
    editModal.classList.add('active');
    editModal.setAttribute('aria-hidden', 'false');
    
    // Pequeno delay para focar o input após o display:flex renderizar
    setTimeout(() => editTaskInput.focus(), 50);
}

// Fechar Modal
function closeEditModal() {
    editModal.classList.remove('active');
    editModal.setAttribute('aria-hidden', 'true');
    state.editingTaskId = null;
    
    // Restaurar foco de onde o usuário veio
    if (state.previousFocus) {
        state.previousFocus.focus();
    }
}

// Salvar as alterações feitas no Modal
function saveEditedTask() {
    if (!state.editingTaskId) return;
    
    const newText = editTaskInput.value.trim();
    
    // Validação inline do modal
    if (!newText) {
        editErrorMessageEl.textContent = 'A tarefa não pode estar vazia.';
        editErrorMessageEl.style.display = 'block';
        editTaskInput.classList.add('invalid');
        return;
    }
    if (newText.length > 100) {
        editErrorMessageEl.textContent = 'A tarefa deve ter menos de 100 caracteres.';
        editErrorMessageEl.style.display = 'block';
        editTaskInput.classList.add('invalid');
        return;
    }

    const task = state.tasks.find(t => t.id === state.editingTaskId);
    if (task) {
        task.text = capitalizeFirstLetter(newText);
        saveTasks();
        renderTasks();
    }
    
    closeEditModal();
}

// Abrir Modal de Exclusão
function deleteTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    state.previousFocus = document.activeElement;
    state.deletingTaskId = id;

    deleteModal.classList.add('active');
    deleteModal.setAttribute('aria-hidden', 'false');
    
    // Focar no botão Cancelar por segurança contra acidentes
    setTimeout(() => cancelDeleteBtn.focus(), 50);
}

// Fechar Modal de Exclusão
function closeDeleteModal() {
    deleteModal.classList.remove('active');
    deleteModal.setAttribute('aria-hidden', 'true');
    state.deletingTaskId = null;

    if (state.previousFocus) {
        state.previousFocus.focus();
    }
}

// Confirmar e Executar Exclusão
function confirmDeleteTask() {
    if (!state.deletingTaskId) return;

    const id = state.deletingTaskId;
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    
    // Esconder modal imediatamente
    deleteModal.classList.remove('active');
    deleteModal.setAttribute('aria-hidden', 'true');
    state.deletingTaskId = null;

    if (taskElement) {
        taskElement.classList.add('removing');
        
        setTimeout(() => {
            state.tasks = state.tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
        }, 300);
    } else {
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
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

    // Desativar input se o limite de 10 for alcançado
    if (state.tasks.length >= 10) {
        taskInput.disabled = true;
        addBtn.disabled = true;
        taskInput.placeholder = "Limite de 10 tarefas alcançado";
    } else {
        taskInput.disabled = false;
        addBtn.disabled = false;
        taskInput.placeholder = "O que você precisa fazer?";
    }

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

// Pressionar Enter no campo de texto principal
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

taskInput.addEventListener('input', clearError);

// Eventos dos Modais
saveEditBtn.addEventListener('click', saveEditedTask);
cancelEditBtn.addEventListener('click', closeEditModal);

confirmDeleteBtn.addEventListener('click', confirmDeleteTask);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);

editTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveEditedTask();
});

editTaskInput.addEventListener('input', () => {
    editErrorMessageEl.style.display = 'none';
    editTaskInput.classList.remove('invalid');
});

// Fechar modais clicando fora ou com ESC
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
});

deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (editModal.classList.contains('active')) closeEditModal();
        if (deleteModal.classList.contains('active')) closeDeleteModal();
    }
});

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', loadTasks);