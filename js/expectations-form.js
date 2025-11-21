// expectations-form.js - Manejo del formulario para participantes
class ExpectationsForm {
    constructor() {
        this.courseData = null;
        this.init();
    }

    init() {
        this.loadCourseData();
        this.bindEvents();
    }

    loadCourseData() {
        const urlParams = new URLSearchParams(window.location.search);
        const expectationsParam = urlParams.get('expectations');

        if (!expectationsParam) {
            this.showError('Enlace inválido. Por favor, escanea el código QR nuevamente.');
            return;
        }

        try {
            const decodedData = atob(expectationsParam);
            this.courseData = JSON.parse(decodedData);
            this.showCourseInfo();
        } catch (error) {
            this.showError('Error cargando la información del curso. Por favor, intenta nuevamente.');
        }
    }

    showCourseInfo() {
        if (!this.courseData) return;

        $('#course-info').html(`
            <h4 class="text-primary">${this.courseData.courseName}</h4>
            <p class="text-muted">Comparte tus expectativas para este curso</p>
            <hr>
        `);

        $('#expectations-form').show();
    }

    bindEvents() {
        $('#expectations-form').on('submit', (e) => {
            e.preventDefault();
            this.submitExpectations();
        });
    }

    submitExpectations() {
        const formData = {
            participantName: $('#participant-name').val().trim(),
            participantId: $('#participant-id').val().trim(),
            expectation1: $('#expectation1').val().trim(),
            expectation2: $('#expectation2').val().trim(),
            expectation3: $('#expectation3').val().trim(),
            courseId: this.courseData.courseId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        // Validaciones
        if (!formData.participantName) {
            this.showError('Por favor ingresa tu nombre completo');
            return;
        }

        if (!formData.expectation1 || !formData.expectation2 || !formData.expectation3) {
            this.showError('Por favor responde todas las preguntas');
            return;
        }

        // Guardar en localStorage (simulando envío al servidor)
        this.saveToLocalStorage(formData);
        this.showSuccess();
    }

    saveToLocalStorage(formData) {
        // Obtener expectativas existentes o crear nuevo array
        const allExpectations = JSON.parse(localStorage.getItem('infotep-expectations') || '[]');
        
        // Verificar si ya existe una respuesta de este participante
        const existingIndex = allExpectations.findIndex(exp => 
            exp.participantId === formData.participantId && exp.courseId === formData.courseId
        );

        if (existingIndex !== -1) {
            // Actualizar respuesta existente
            allExpectations[existingIndex] = formData;
        } else {
            // Agregar nueva respuesta
            allExpectations.push(formData);
        }

        // Guardar en localStorage
        localStorage.setItem('infotep-expectations', JSON.stringify(allExpectations));
        
        // También guardar en el curso específico si estamos en la misma sesión
        if (window.app && window.app.courses) {
            const course = window.app.courses.find(c => c.id === formData.courseId);
            if (course) {
                if (!course.expectativas) {
                    course.expectativas = { respuestas: {} };
                }
                if (!course.expectativas.respuestas) {
                    course.expectativas.respuestas = {};
                }

                course.expectativas.respuestas[formData.participantId] = {
                    expectativa1: formData.expectation1,
                    expectativa2: formData.expectation2,
                    expectativa3: formData.expectation3,
                    fechaRespuesta: formData.timestamp,
                    metodo: 'qr',
                    nombre: formData.participantName
                };

                // Guardar cambios en los cursos
                localStorage.setItem('infotep-courses', JSON.stringify(window.app.courses));
            }
        }
    }

    showSuccess() {
        $('#expectations-form').hide();
        $('#success-message').show();
        
        // Opcional: Redirigir después de 3 segundos
        setTimeout(() => {
            // Puedes redirigir a una página de agradecimiento o cerrar la ventana
            window.close(); // Cierra la ventana si fue abierta desde el QR
        }, 3000);
    }

    showError(message) {
        $('#error-text').text(message);
        $('#error-message').show();
        
        setTimeout(() => {
            $('#error-message').hide();
        }, 5000);
    }
}

// Inicializar cuando el documento esté listo
$(document).ready(() => {
    new ExpectationsForm();
});