// expectations-form.js - Con manejo mejorado de errores
class ExpectationsForm {
    constructor() {
        this.courseData = null;
        this.participants = [];
        this.init();
    }

    init() {
        console.log('🔧 Inicializando formulario de expectativas...');
        this.loadCourseData();
        this.bindEvents();
    }

    loadCourseData() {
        console.log('📖 Cargando datos del curso...');
        const urlParams = new URLSearchParams(window.location.search);
        const dataParam = urlParams.get('data');

        if (!dataParam) {
            this.showError('❌ Enlace inválido. No se encontraron datos del curso.');
            return;
        }

        try {
            // Decodificar los datos del QR
            const decodedData = decodeURIComponent(atob(dataParam));
            this.courseData = JSON.parse(decodedData);
            console.log('✅ Datos del curso cargados:', this.courseData);
            
            this.showCourseInfo();
            this.loadParticipantsList();
        } catch (error) {
            console.error('❌ Error decodificando datos:', error);
            this.showError('❌ Error cargando la información del curso. Por favor, escanea el QR nuevamente.');
        }
    }

    showCourseInfo() {
        if (!this.courseData) return;

        $('#course-info').html(`
            <h4 class="text-primary">${this.courseData.courseName}</h4>
            <p class="text-muted">Comparte tus expectativas para este curso</p>
            <hr>
        `);
    }

    loadParticipantsList() {
        console.log('👥 Cargando lista de participantes...');
        
        // Cargar desde localStorage
        const savedCourses = localStorage.getItem('infotep-courses');
        if (!savedCourses) {
            this.showError('❌ No se encontró información del curso en el sistema.');
            return;
        }

        try {
            const courses = JSON.parse(savedCourses);
            const currentCourse = courses.find(c => c.id === this.courseData.courseId);
            
            if (!currentCourse) {
                this.showError('❌ Curso no encontrado en el sistema.');
                return;
            }

            if (!currentCourse.participantes || currentCourse.participantes.length === 0) {
                this.showError('❌ No hay participantes registrados en este curso.');
                return;
            }

            this.participants = currentCourse.participantes.filter(p => p.estado === 'activo');
            
            if (this.participants.length === 0) {
                this.showError('❌ No hay participantes activos en este curso.');
                return;
            }

            console.log(`✅ ${this.participants.length} participantes cargados`);

            $('#participant-selection').html(`
                <div class="form-group">
                    <label class="font-weight-bold">Selecciona tu nombre de la lista *</label>
                    <select class="form-control" id="select-participant" required>
                        <option value="">-- Selecciona tu nombre --</option>
                        ${this.participants.map(participant => `
                            <option value="${participant.id}">
                                ${participant.nombre} 
                                ${participant.id ? `(${participant.id})` : ''}
                            </option>
                        `).join('')}
                    </select>
                    <small class="form-text text-muted">
                        Tu nombre debe aparecer en esta lista. Si no estás, contacta al instructor.
                    </small>
                </div>
            `).show();

            // Configurar evento de cambio
            $('#select-participant').on('change', () => {
                this.onParticipantSelected();
            });

        } catch (error) {
            console.error('❌ Error cargando participantes:', error);
            this.showError('❌ Error al cargar la lista de participantes.');
        }
    }

    onParticipantSelected() {
        const participantId = $('#select-participant').val();
        console.log('🎯 Participante seleccionado:', participantId);
        
        if (participantId) {
            const participant = this.participants.find(p => p.id === participantId);
            if (participant) {
                $('#participant-info').html(`
                    <div class="alert alert-success">
                        <i class="fas fa-user-check"></i>
                        <strong>Confirmado:</strong> Eres <strong>${participant.nombre}</strong>
                        ${participant.id ? ` (ID: ${participant.id})` : ''}
                        ${participant.telefono ? ` | Tel: ${participant.telefono}` : ''}
                        ${participant.email ? ` | Email: ${participant.email}` : ''}
                    </div>
                `).show();
                $('#expectations-form').show();
                
                // Hacer scroll al formulario
                $('html, body').animate({
                    scrollTop: $('#expectations-form').offset().top - 100
                }, 500);
            }
        } else {
            $('#participant-info').hide();
            $('#expectations-form').hide();
        }
    }

    bindEvents() {
        $('#expectations-form').on('submit', (e) => {
            e.preventDefault();
            this.submitExpectations();
        });
    }

    submitExpectations() {
        const participantId = $('#select-participant').val();
        
        if (!participantId) {
            this.showError('❌ Por favor selecciona tu nombre de la lista');
            return;
        }

        const participant = this.participants.find(p => p.id === participantId);
        if (!participant) {
            this.showError('❌ Participante no encontrado');
            return;
        }

        const formData = {
            participantId: participantId,
            participantName: participant.nombre,
            expectation1: $('#expectation1').val().trim(),
            expectation2: $('#expectation2').val().trim(),
            expectation3: $('#expectation3').val().trim(),
            courseId: this.courseData.courseId,
            courseName: this.courseData.courseName,
            timestamp: new Date().toISOString(),
            submittedFrom: 'qr_form'
        };

        // Validaciones
        if (!formData.expectation1 || !formData.expectation2 || !formData.expectation3) {
            this.showError('❌ Por favor responde todas las preguntas');
            return;
        }

        if (formData.expectation1.length < 10 || formData.expectation2.length < 10 || formData.expectation3.length < 10) {
            this.showError('❌ Por favor escribe respuestas más detalladas (mínimo 10 caracteres cada una)');
            return;
        }

        console.log('📤 Enviando expectativas:', formData);
        this.saveExpectations(formData);
    }

    saveExpectations(formData) {
        try {
            // Obtener expectativas existentes
            const allExpectations = JSON.parse(localStorage.getItem('infotep-expectations') || '[]');
            
            // Eliminar respuesta anterior si existe
            const filteredExpectations = allExpectations.filter(exp => 
                !(exp.participantId === formData.participantId && exp.courseId === formData.courseId)
            );
            
            // Agregar nueva respuesta
            filteredExpectations.push(formData);
            
            // Guardar en localStorage
            localStorage.setItem('infotep-expectations', JSON.stringify(filteredExpectations));
            
            console.log('✅ Expectativas guardadas correctamente');
            this.showSuccess();

            // Actualizar el curso principal
            this.updateMainCourse(formData);
            
        } catch (error) {
            console.error('❌ Error guardando expectativas:', error);
            this.showError('❌ Error al guardar las expectativas. Por favor, intenta nuevamente.');
        }
    }

    updateMainCourse(formData) {
        try {
            const savedCourses = localStorage.getItem('infotep-courses');
            if (savedCourses) {
                const courses = JSON.parse(savedCourses);
                const courseIndex = courses.findIndex(c => c.id === formData.courseId);
                
                if (courseIndex !== -1) {
                    if (!courses[courseIndex].expectativas) {
                        courses[courseIndex].expectativas = { respuestas: {} };
                    }
                    if (!courses[courseIndex].expectativas.respuestas) {
                        courses[courseIndex].expectativas.respuestas = {};
                    }
                    
                    courses[courseIndex].expectativas.respuestas[formData.participantId] = {
                        expectativa1: formData.expectation1,
                        expectativa2: formData.expectation2,
                        expectativa3: formData.expectation3,
                        fechaRespuesta: formData.timestamp,
                        metodo: 'qr',
                        nombre: formData.participantName
                    };
                    
                    localStorage.setItem('infotep-courses', JSON.stringify(courses));
                    console.log('✅ Curso principal actualizado');
                }
            }
        } catch (error) {
            console.warn('⚠️ No se pudo actualizar el curso principal:', error);
        }
    }

    showSuccess() {
        $('#participant-selection').hide();
        $('#expectations-form').hide();
        $('#success-message').show();
        
        // Mostrar resumen
        $('#success-message').append(`
            <div class="mt-3 p-3 border rounded bg-light">
                <h6><i class="fas fa-check-circle text-success"></i> Resumen de tu envío:</h6>
                <p><strong>¿Qué aprenderé?</strong><br><small>${$('#expectation1').val().substring(0, 100)}...</small></p>
                <p><strong>¿Cómo lo aplicaré?</strong><br><small>${$('#expectation2').val().substring(0, 100)}...</small></p>
                <p><strong>¿Qué metas tengo?</strong><br><small>${$('#expectation3').val().substring(0, 100)}...</small></p>
            </div>
        `);
        
        // Hacer scroll al éxito
        $('html, body').animate({
            scrollTop: $('#success-message').offset().top - 100
        }, 500);
    }

    showError(message) {
        $('#error-text').html(message);
        $('#error-message').show();
        
        // Hacer scroll al error
        $('html, body').animate({
            scrollTop: $('#error-message').offset().top - 100
        }, 500);
        
        setTimeout(() => {
            $('#error-message').hide();
        }, 8000);
    }
}

// Inicializar cuando el documento esté listo
$(document).ready(() => {
    console.log('🚀 Documento listo, iniciando formulario...');
    window.expectationsForm = new ExpectationsForm();
});