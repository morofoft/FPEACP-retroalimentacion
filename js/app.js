// Aplicación principal INFOTEP
class InfotepApp {
    constructor() {
        this.currentCourseId = null;
        this.courses = [];
        this.settings = this.loadSettings();

        // INICIALIZAR MANAGERS
        this.participantsManager = ParticipantsManager;
        // this.rotationManager = RotationManager;
        // this.communitiesManager = CommunitiesManager;
    }

    init() {
        this.loadCourses();
        this.bindEvents();
        this.updateDashboard();
        console.log('Sistema INFOTEP inicializado');
    }

    loadCourses() {
        const saved = localStorage.getItem('infotep-courses');
        this.courses = saved ? JSON.parse(saved) : [];
        this.renderCoursesList();
    }

    saveCourses() {
        localStorage.setItem('infotep-courses', JSON.stringify(this.courses));
    }

    bindEvents() {
        // Gestión de cursos
        $('#course-manager-btn').on('click', () => this.showCoursesManager());
        $('#create-first-course').on('click', () => this.showCoursesManager());

        // Navegación global
        $(document).on('click', '.course-item', (e) => {
            const courseId = $(e.currentTarget).data('course-id');
            this.selectCourse(courseId);
        });
    }

    renderCoursesList() {
        const container = $('#courses-list');
        container.empty();

        if (this.courses.length === 0) {
            container.append(`
                <li class="nav-item">
                    <div class="nav-link text-center">
                        <small class="text-muted">No hay cursos activos</small>
                    </div>
                </li>
            `);
            return;
        }

        this.courses.forEach(course => {
            const isActive = this.currentCourseId === course.id;
            const courseItem = $(`
                <li class="nav-item">
                    <a href="#" class="nav-link course-item ${isActive ? 'active' : ''}" 
                       data-course-id="${course.id}">
                        <i class="nav-icon fas fa-graduation-cap"></i>
                        <p>
                            ${course.nombre}
                            <span class="right badge badge-${course.estado === 'activo' ? 'success' : 'secondary'}">
                                ${course.estado}
                            </span>
                        </p>
                    </a>
                </li>
            `);
            container.append(courseItem);
        });
    }

    showCoursesManager() {
        // Implementar modal de gestión de cursos
        $('#coursesModal .modal-title').text('Gestión de Cursos');
        $('#coursesModal .modal-body').html(`
            <div class="text-center">
                <h4>Gestión de Cursos INFOTEP</h4>
                <p class="text-muted">Crear y administrar cursos técnicos</p>
                
                <div class="row mt-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5><i class="fas fa-plus text-primary"></i> Nuevo Curso</h5>
                                <p>Crear un nuevo curso técnico</p>
                                <button class="btn btn-primary btn-block" id="create-course-btn">
                                    Crear Curso
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5><i class="fas fa-list text-success"></i> Cursos Existentes</h5>
                                <p>Gestionar cursos creados</p>
                                <button class="btn btn-success btn-block" id="manage-courses-btn">
                                    Ver Cursos
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        $('#coursesModal').modal('show');

        // Eventos del modal
        $('#create-course-btn').on('click', () => this.showCreateCourseForm());
        $('#manage-courses-btn').on('click', () => this.showCoursesList());
    }

    showCreateCourseForm() {
        $('#coursesModal .modal-body').html(`
            <h5>Crear Nuevo Curso</h5>
            <form id="create-course-form">
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Nombre del Curso *</label>
                            <input type="text" class="form-control" id="course-name" required>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Código del Curso *</label>
                            <input type="text" class="form-control" id="course-code" required>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Duración (semanas) *</label>
                            <input type="number" class="form-control" id="course-duration" min="1" max="52" value="8" required>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Fecha de Inicio *</label>
                            <input type="date" class="form-control" id="course-start-date" required>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Horario</label>
                            <input type="text" class="form-control" id="course-schedule" placeholder="Ej: Lunes-Viernes 8:00-12:00">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label>Modalidad</label>
                            <select class="form-control" id="course-modality">
                                <option value="presencial">Presencial</option>
                                <option value="virtual">Virtual</option>
                                <option value="hibrido">Híbrido</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label>Descripción</label>
                    <textarea class="form-control" id="course-description" rows="3"></textarea>
                </div>

                <div class="form-group">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Crear Curso
                    </button>
                    <button type="button" class="btn btn-secondary" id="back-to-manager">
                        <i class="fas fa-arrow-left"></i> Volver
                    </button>
                </div>
            </form>
        `);

        // Establecer fecha mínima como hoy
        const today = new Date().toISOString().split('T')[0];
        $('#course-start-date').attr('min', today);

        $('#create-course-form').on('submit', (e) => {
            e.preventDefault();
            this.createCourse();
        });

        $('#back-to-manager').on('click', () => this.showCoursesManager());
    }

    createCourse() {
        const courseData = {
            nombre: $('#course-name').val(),
            codigo: $('#course-code').val(),
            duracion: parseInt($('#course-duration').val()),
            fechaInicio: $('#course-start-date').val(),
            horario: $('#course-schedule').val(),
            modalidad: $('#course-modality').val(),
            descripcion: $('#course-description').val(),
            estado: 'activo'
        };

        // Validaciones básicas
        if (!courseData.nombre || !courseData.codigo) {
            alert('Nombre y código son obligatorios');
            return;
        }

        const newCourse = {
            id: 'course-' + Date.now(),
            ...courseData,
            fechaCreacion: new Date().toISOString(),
            participantes: [],
            comunidadesPrincipales: [
                { id: 'feedback', nombre: 'Feedback', color: '#1a2a6c' },
                { id: 'dinamica', nombre: 'Dinámica', color: '#28a745' },
                { id: 'orden', nombre: 'Orden y Limpieza', color: '#fd7e14' }
            ],
            comunidadesTemporales: [],
            rotacionActual: 1
        };

        this.courses.push(newCourse);
        this.saveCourses();
        this.renderCoursesList();

        $('#coursesModal').modal('hide');
        this.selectCourse(newCourse.id);

        this.showNotification('Curso creado exitosamente', 'success');
    }

    selectCourse(courseId) {
        this.currentCourseId = courseId;
        const course = this.courses.find(c => c.id === courseId);

        if (course) {
            // Actualizar UI
            $('#current-course-info span').text(course.nombre);
            $('#page-title').text(course.nombre);
            $('#breadcrumb-active').text('Curso Activo');

            // Mostrar contenido del curso
            $('#dashboard-content').hide();
            $('#course-content').show();

            // Renderizar contenido específico del curso
            this.renderCourseContent(course);

            // Actualizar lista de cursos en sidebar
            this.renderCoursesList();

            console.log('Curso seleccionado:', course.nombre);
        }
    }

    renderCourseContent(course) {
        $('#course-content').html(`
            <div class="row">
                <div class="col-md-3">
                    <div class="card card-primary">
                        <div class="card-header">
                            <h3 class="card-title">Información del Curso</h3>
                        </div>
                        <div class="card-body">
                            <p><strong>Código:</strong> ${course.codigo}</p>
                            <p><strong>Duración:</strong> ${course.duracion} semanas</p>
                            <p><strong>Inicio:</strong> ${new Date(course.fechaInicio).toLocaleDateString()}</p>
                            <p><strong>Modalidad:</strong> ${course.modalidad}</p>
                            <p><strong>Horario:</strong> ${course.horario || 'No especificado'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-9">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Acciones Rápidas</h3>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <button class="btn btn-info btn-block mb-2" id="manage-participants-btn">
                                        <i class="fas fa-users"></i> Gestionar Participantes
                                    </button>
                                </div>
                                <div class="col-md-4">
                                    <button class="btn btn-success btn-block mb-2" id="rotation-manager-btn">
                                        <i class="fas fa-sync-alt"></i> Rotación Semanal
                                    </button>
                                </div>
                                <div class="col-md-4">
                                    <button class="btn btn-warning btn-block mb-2" id="communities-manager-btn">
                                        <i class="fas fa-layer-group"></i> Comunidades
                                    </button>
                                </div>
                                <div class="col-md-4">
                                    <button class="btn btn-purple btn-block mb-2" id="expectations-manager-btn">
                                        <i class="fas fa-bullseye"></i> Módulo Expectativas
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Aquí se cargarán los módulos específicos -->
                    <div id="course-modules-content">
                        <div class="text-center mt-5">
                            <h4>Selecciona una acción para comenzar</h4>
                            <p class="text-muted">Gestiona participantes, rotaciones y comunidades</p>
                        </div>
                    </div>
                </div>
            </div>
        `);

        // Bind events para los botones de acción
        $('#manage-participants-btn').on('click', () => ParticipantsManager.showParticipantsManager(course));
        $('#rotation-manager-btn').on('click', () => RotationManager.showRotationManager(course));
        $('#communities-manager-btn').on('click', () => CommunitiesManager.showCommunitiesManager(course));
        $('#expectations-manager-btn').on('click', () => ExpectationsManager.showExpectationsManager(course));
    }

    updateDashboard() {
        $('#active-courses-count').text(this.courses.filter(c => c.estado === 'activo').length);

        const totalParticipants = this.courses.reduce((total, course) =>
            total + (course.participantes ? course.participantes.length : 0), 0);
        $('#total-participants-count').text(totalParticipants);
    }

    showNotification(message, type = 'info') {
        // Implementación básica de notificación
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const alert = $(`
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="close" data-dismiss="alert">
                    <span>&times;</span>
                </button>
            </div>
        `);

        $('.content-header').after(alert);

        setTimeout(() => {
            alert.alert('close');
        }, 3000);
    }

    loadSettings() {
        return {
            version: '2.0.0'
        };
    }
}

// Inicializar aplicación
$(document).ready(() => {
    window.app = new InfotepApp();
    app.init();
});