// Módulo Completo de Gestión de Expectativas
class ExpectationsManager {
    static showExpectationsManager(course) {
        // Cargar respuestas QR al abrir el módulo
        const nuevasRespuestas = this.cargarRespuestasQR(course);
        if (nuevasRespuestas > 0) {
            app.showNotification(`Se cargaron ${nuevasRespuestas} nuevas respuestas QR`, 'success');
        }

        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-bullseye"></i> Módulo de Expectativas
                        <span class="badge badge-info ml-2">
                            ${this.getRespuestasCount(course)}/${course.participantes ? course.participantes.length : 0} respuestas
                        </span>
                    </h3>
                    <div class="card-tools">
                        <button class="btn btn-success btn-sm" id="setup-expectations-btn">
                            <i class="fas fa-cog"></i> Configurar
                        </button>
                        <button class="btn btn-primary btn-sm" id="view-responses-btn">
                            <i class="fas fa-chart-bar"></i> Reportes
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="info-box bg-gradient-info">
                                <span class="info-box-icon"><i class="fas fa-target"></i></span>
                                <div class="info-box-content">
                                    <span class="info-box-text">Expectativas Iniciales</span>
                                    <span class="info-box-number">${this.getRespuestasCount(course)}</span>
                                    <div class="progress">
                                        <div class="progress-bar" style="width: ${this.getPorcentajeCompletado(course)}%"></div>
                                    </div>
                                    <span class="progress-description">
                                        ${this.getPorcentajeCompletado(course)}% completado
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <div class="info-box bg-gradient-success">
                                <span class="info-box-icon"><i class="fas fa-check-circle"></i></span>
                                <div class="info-box-content">
                                    <span class="info-box-text">Seguimiento Activo</span>
                                    <span class="info-box-number">${this.getSeguimientosCount(course)}</span>
                                    <span class="progress-description">
                                        Checkpoints realizados
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <div class="info-box bg-gradient-warning">
                                <span class="info-box-icon"><i class="fas fa-star"></i></span>
                                <div class="info-box-content">
                                    <span class="info-box-text">Evaluaciones Finales</span>
                                    <span class="info-box-number">${this.getEvaluacionesCount(course)}</span>
                                    <span class="progress-description">
                                        Completadas
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row mt-4">
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title">
                                        <i class="fas fa-qrcode"></i> Código QR para Participantes
                                    </h5>
                                </div>
                                <div class="card-body text-center">
                                    <div id="qrcode-container" class="mb-3">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="sr-only">Generando QR...</span>
                                        </div>
                                        <p class="mt-2">Generando código QR...</p>
                                    </div>
                                    <p class="text-muted">
                                        Los participantes escanean este código para registrar sus expectativas
                                    </p>
                                    <button class="btn btn-outline-primary btn-sm" id="refresh-qr">
                                        <i class="fas fa-sync"></i> Regenerar QR
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title">
                                        <i class="fas fa-list-check"></i> Acciones Rápidas
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <button class="btn btn-info btn-block mb-2" id="collect-expectations-btn">
                                        <i class="fas fa-edit"></i> Recolectar Manualmente
                                    </button>
                                    <button class="btn btn-warning btn-block mb-2" id="setup-checkpoints-btn">
                                        <i class="fas fa-calendar-check"></i> Checkpoints
                                    </button>
                                    <button class="btn btn-success btn-block mb-2" id="run-evaluation-btn">
                                        <i class="fas fa-clipboard-check"></i> Evaluación Final
                                    </button>
                                    <button class="btn btn-secondary btn-block" id="view-all-responses-btn">
                                        <i class="fas fa-table"></i> Ver Respuestas
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Resumen de Respuestas -->
                    <div class="row mt-4">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title">
                                        <i class="fas fa-chart-pie"></i> Resumen de Expectativas
                                    </h5>
                                </div>
                                <div class="card-body">
                                    ${this.generarResumenExpectativas(course)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.generarQRCode(course);
        this.bindExpectationsEvents(course);
    }

    static getRespuestasCount(course) {
        if (!course.expectativas || !course.expectativas.respuestas) return 0;
        return Object.keys(course.expectativas.respuestas).length;
    }

    static getSeguimientosCount(course) {
        if (!course.expectativas) return 0;
        return course.expectativas.seguimientos ? course.expectativas.seguimientos.length : 0;
    }

    static getEvaluacionesCount(course) {
        if (!course.expectativas) return 0;
        return course.expectativas.evaluaciones ? Object.keys(course.expectativas.evaluaciones).length : 0;
    }

    static getPorcentajeCompletado(course) {
        const total = course.participantes ? course.participantes.length : 0;
        if (total === 0) return 0;
        return Math.round((this.getRespuestasCount(course) / total) * 100);
    }

    static generarResumenExpectativas(course) {
        if (!course.expectativas || !course.expectativas.respuestas || Object.keys(course.expectativas.respuestas).length === 0) {
            return `
                <div class="text-center py-4">
                    <i class="fas fa-bullseye fa-3x text-muted mb-3"></i>
                    <h4>No hay expectativas registradas aún</h4>
                    <p class="text-muted">Comienza configurando el módulo y recolectando expectativas</p>
                    <button class="btn btn-primary" id="start-expectations-setup">
                        <i class="fas fa-play-circle"></i> Comenzar
                    </button>
                </div>
            `;
        }

        const palabrasClave = this.analizarPalabrasClave(course);
        const temasComunes = this.analizarTemasComunes(course);

        return `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fas fa-keywords"></i> Palabras Clave Más Frecuentes:</h6>
                    <div class="mb-3">
                        ${palabrasClave.slice(0, 6).map(([palabra, count]) => `
                            <span class="badge badge-primary mr-1 mb-1">
                                ${palabra} <span class="badge badge-light">${count}</span>
                            </span>
                        `).join('')}
                    </div>
                    
                    <h6><i class="fas fa-chart-line"></i> Progreso de Recolección:</h6>
                    <div class="progress mb-2" style="height: 25px;">
                        <div class="progress-bar bg-success progress-bar-striped" style="width: ${this.getPorcentajeCompletado(course)}%">
                            ${this.getPorcentajeCompletado(course)}%
                        </div>
                    </div>
                    <small class="text-muted">
                        ${this.getRespuestasCount(course)} de ${course.participantes ? course.participantes.length : 0} participantes han respondido
                    </small>
                </div>
                
                <div class="col-md-6">
                    <h6><i class="fas fa-themes"></i> Temas Comunes:</h6>
                    <div class="mb-3">
                        ${temasComunes.slice(0, 4).map(([tema, count]) => `
                            <div class="mb-2">
                                <small><strong>${tema}:</strong> ${count} menciones</small>
                                <div class="progress" style="height: 8px;">
                                    <div class="progress-bar bg-info" style="width: ${(count / this.getRespuestasCount(course)) * 100}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <h6><i class="fas fa-users-slash"></i> Pendientes por Responder:</h6>
                    <div style="max-height: 120px; overflow-y: auto;">
                        ${this.getParticipantesSinResponder(course).slice(0, 5).map(participant => `
                            <div class="mb-1">
                                <small class="text-muted">• ${participant.nombre}</small>
                            </div>
                        `).join('')}
                        ${this.getParticipantesSinResponder(course).length > 5 ?
                `<small class="text-muted">... y ${this.getParticipantesSinResponder(course).length - 5} más</small>` :
                ''}
                        ${this.getParticipantesSinResponder(course).length === 0 ?
                '<small class="text-success"><i class="fas fa-check"></i> ¡Todos han respondido!</small>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    static analizarPalabrasClave(course) {
        const palabrasComunes = [
            'aprender', 'conocer', 'desarrollar', 'mejorar', 'aplicar',
            'entender', 'lograr', 'adquirir', 'dominarr', 'profundizar',
            'práctica', 'teoría', 'habilidad', 'conocimiento', 'técnica'
        ];
        const frecuencia = {};

        Object.values(course.expectativas.respuestas).forEach(respuesta => {
            const texto = (respuesta.expectativa1 + ' ' + respuesta.expectativa2 + ' ' + respuesta.expectativa3).toLowerCase();
            palabrasComunes.forEach(palabra => {
                if (texto.includes(palabra)) {
                    frecuencia[palabra] = (frecuencia[palabra] || 0) + 1;
                }
            });
        });

        return Object.entries(frecuencia).sort((a, b) => b[1] - a[1]);
    }

    static analizarTemasComunes(course) {
        const temas = {
            'Empleo/Carrera': 0,
            'Emprendimiento': 0,
            'Desarrollo Personal': 0,
            'Certificación': 0,
            'Ingresos/Económico': 0,
            'Conocimiento Técnico': 0
        };

        const palabrasClave = {
            'Empleo/Carrera': ['trabajo', 'empleo', 'carrera', 'profesional', 'laboral'],
            'Emprendimiento': ['negocio', 'emprender', 'empresa', 'independiente', 'propio'],
            'Desarrollo Personal': ['crecer', 'superación', 'personal', 'desarrollo'],
            'Certificación': ['certificado', 'certificación', 'diploma', 'titulo'],
            'Ingresos/Económico': ['ingresos', 'dinero', 'económico', 'sueldo', 'ganar'],
            'Conocimiento Técnico': ['técnico', 'especializado', 'avanzado', 'experto']
        };

        Object.values(course.expectativas.respuestas).forEach(respuesta => {
            const texto = (respuesta.expectativa1 + ' ' + respuesta.expectativa2 + ' ' + respuesta.expectativa3).toLowerCase();

            Object.entries(palabrasClave).forEach(([tema, palabras]) => {
                if (palabras.some(palabra => texto.includes(palabra))) {
                    temas[tema]++;
                }
            });
        });

        return Object.entries(temas)
            .filter(([_, count]) => count > 0)
            .sort((a, b) => b[1] - a[1]);
    }

    static getParticipantesSinResponder(course) {
        if (!course.participantes) return [];
        if (!course.expectativas || !course.expectativas.respuestas) return course.participantes;

        return course.participantes.filter(participant =>
            !course.expectativas.respuestas[participant.id]
        );
    }

// expectations.js - Método generarQRCode corregido para QRCode.js
static generarQRCode(course) {
    const qrContainer = document.getElementById('qrcode-container');
    
    // Limpiar contenedor
    qrContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="sr-only">Generando QR...</span></div><p class="mt-2">Generando código QR...</p></div>';

    // Crear URL para el formulario
    const qrData = JSON.stringify({
        courseId: course.id,
        courseName: course.nombre,
        timestamp: Date.now()
    });

    const encodedData = btoa(encodeURIComponent(qrData));
    const qrUrl = `expectations-form.html?data=${encodedData}`;
    const fullUrl = window.location.href.split('/').slice(0, -1).join('/') + '/' + qrUrl;

    console.log('🔧 Generando QR para:', qrUrl);

    // Verificar si la librería QR está disponible
    if (typeof QRCode !== 'undefined') {
        console.log('✅ QRCode library loaded successfully');
        
        // Limpiar el contenedor primero
        qrContainer.innerHTML = '<div id="qrcode-canvas" class="text-center"></div>';
        
        const qrElement = document.getElementById('qrcode-canvas');
        
        try {
            // Crear el QR code usando la API correcta
            const qrcode = new QRCode(qrElement, {
                text: qrUrl,
                width: 180,
                height: 180,
                colorDark: '#1a2a6c',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
            
            console.log('✅ QR generado exitosamente');
            
            // Agregar los botones después del QR
            setTimeout(() => {
                qrContainer.innerHTML += `
                    <div class="mt-3">
                        <button class="btn btn-outline-primary btn-sm mr-2" onclick="navigator.clipboard.writeText('${fullUrl}')">
                            <i class="fas fa-copy"></i> Copiar Enlace
                        </button>
                        <a href="${qrUrl}" class="btn btn-outline-success btn-sm">
                            <i class="fas fa-external-link-alt"></i> Abrir
                        </a>
                    </div>
                    <small class="text-muted d-block mt-2">
                        Escanear con la cámara del teléfono
                    </small>
                `;
            }, 100);
            
        } catch (error) {
            console.error('❌ Error generando QR:', error);
            this.mostrarQRAlternativo(qrContainer, fullUrl, qrUrl);
        }
        
    } else {
        console.error('❌ QRCode library not available');
        this.mostrarQRAlternativo(qrContainer, fullUrl, qrUrl);
    }
}

static mostrarQRAlternativo(container, fullUrl, qrUrl) {
    container.innerHTML = `
        <div class="text-center">
            <div style="width: 180px; height: 180px; background: #f8f9fa; border: 2px solid #dee2e6; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; margin-bottom: 15px;">
                <div class="text-center">
                    <i class="fas fa-qrcode fa-3x text-muted mb-2"></i>
                    <br>
                    <small class="text-muted">QR Simulado</small>
                </div>
            </div>
            <div class="mt-3">
                <button class="btn btn-outline-primary btn-sm mr-2" onclick="navigator.clipboard.writeText('${fullUrl}')">
                    <i class="fas fa-copy"></i> Copiar Enlace
                </button>
                <a href="${qrUrl}" class="btn btn-outline-success btn-sm">
                    <i class="fas fa-external-link-alt"></i> Abrir Formulario
                </a>
            </div>
            <small class="text-muted d-block mt-2">
                Usa el enlace directo para acceder al formulario
            </small>
            <div class="mt-2">
                <small class="text-info">
                    <i class="fas fa-info-circle"></i>
                    Enlace: ${fullUrl}
                </small>
            </div>
        </div>
    `;
}

// En el método bindExpectationsEvents, actualiza el evento del botón refresh:
static bindExpectationsEvents(course) {
    $('#setup-expectations-btn').on('click', () => this.showSetupForm(course));
    $('#view-responses-btn').on('click', () => this.showAllResponses(course));
    $('#refresh-qr').on('click', () => this.regenerarQRCode(course)); // ← Cambiado
    $('#collect-expectations-btn').on('click', () => this.showManualCollection(course));
    $('#setup-checkpoints-btn').on('click', () => this.showCheckpointsSetup(course));
    $('#run-evaluation-btn').on('click', () => this.showFinalEvaluation(course));
    $('#view-all-responses-btn').on('click', () => this.showAllResponses(course));
    $('#start-expectations-setup').on('click', () => this.showSetupForm(course));
}

static regenerarQRCode(course) {
    console.log('🔄 Regenerando QR code...');
    
    // Mostrar mensaje de regeneración
    const qrContainer = document.getElementById('qrcode-container');
    qrContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="sr-only">Regenerando QR...</span></div><p class="mt-2">Regenerando código QR...</p></div>';
    
    // Pequeño delay para que se vea el spinner
    setTimeout(() => {
        this.generarQRCode(course);
    }, 500);
}

static mostrarQRAlternativo(container, fullUrl, qrUrl) {
    container.innerHTML = `
        <div class="text-center">
            <div style="width: 200px; height: 200px; background: #f8f9fa; border: 2px dashed #dee2e6; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; margin-bottom: 15px;">
                <div class="text-center">
                    <i class="fas fa-qrcode fa-3x text-muted mb-2"></i>
                    <br>
                    <small class="text-muted">Código QR</small>
                    <br>
                    <small class="text-danger">(No disponible)</small>
                </div>
            </div>
            <div class="mt-3">
                <button class="btn btn-outline-primary btn-sm mr-2" onclick="navigator.clipboard.writeText('${fullUrl}')">
                    <i class="fas fa-copy"></i> Copiar Enlace
                </button>
                <a href="${qrUrl}" class="btn btn-outline-success btn-sm">
                    <i class="fas fa-external-link-alt"></i> Abrir Formulario
                </a>
            </div>
            <small class="text-muted d-block mt-2">
                Usa el enlace directo para acceder al formulario
            </small>
            <small class="text-warning d-block mt-1">
                <i class="fas fa-exclamation-triangle"></i>
                Si el QR no se genera, usa el botón "Abrir Formulario"
            </small>
        </div>
    `;
}

    static mostrarQRAlternativo(container, qrUrl) {
        container.innerHTML = `
        <div class="text-center">
            <div style="width: 200px; height: 200px; background: #f8f9fa; border: 2px dashed #dee2e6; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; margin-bottom: 15px;">
                <div class="text-center">
                    <i class="fas fa-qrcode fa-3x text-muted mb-2"></i>
                    <br>
                    <small class="text-muted">Código QR</small>
                </div>
            </div>
            <div class="mt-3">
                <button class="btn btn-outline-primary btn-sm mr-2" onclick="navigator.clipboard.writeText('${window.location.href.split('/').slice(0, -1).join('/')}/${qrUrl}')">
                    <i class="fas fa-copy"></i> Copiar Enlace
                </button>
                <a href="${qrUrl}" class="btn btn-outline-success btn-sm">
                    <i class="fas fa-external-link-alt"></i> Abrir Formulario
                </a>
            </div>
            <small class="text-muted d-block mt-2">
                Enlace directo al formulario de expectativas
            </small>
            <small class="text-warning d-block mt-1">
                <i class="fas fa-exclamation-triangle"></i>
                Si el enlace no funciona, verifica que el archivo expectations-form.html esté en la misma carpeta
            </small>
        </div>
    `;
    }

    static mostrarQRAlternativo(container, qrUrl) {
        container.innerHTML = `
            <div class="text-center">
                <div style="width: 200px; height: 200px; background: #f8f9fa; border: 2px dashed #dee2e6; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; margin-bottom: 15px;">
                    <div class="text-center">
                        <i class="fas fa-qrcode fa-3x text-muted mb-2"></i>
                        <br>
                        <small class="text-muted">Código QR</small>
                    </div>
                </div>
                <div class="mt-3">
                    <button class="btn btn-outline-primary btn-sm mr-2" onclick="navigator.clipboard.writeText('${window.location.origin + '/' + qrUrl}')">
                        <i class="fas fa-copy"></i> Copiar Enlace
                    </button>
                    <a href="${qrUrl}" target="_blank" class="btn btn-outline-success btn-sm">
                        <i class="fas fa-external-link-alt"></i> Abrir Formulario
                    </a>
                </div>
                <small class="text-muted d-block mt-2">
                    Enlace directo al formulario de expectativas
                </small>
            </div>
        `;
    }

    static bindExpectationsEvents(course) {
        $('#setup-expectations-btn').on('click', () => this.showSetupForm(course));
        $('#view-responses-btn').on('click', () => this.showAllResponses(course));
        $('#refresh-qr').on('click', () => this.generarQRCode(course));
        $('#collect-expectations-btn').on('click', () => this.showManualCollection(course));
        $('#setup-checkpoints-btn').on('click', () => this.showCheckpointsSetup(course));
        $('#run-evaluation-btn').on('click', () => this.showFinalEvaluation(course));
        $('#view-all-responses-btn').on('click', () => this.showAllResponses(course));
        $('#start-expectations-setup').on('click', () => this.showSetupForm(course));
    }

    static showSetupForm(course) {
        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-cog"></i> Configurar Módulo de Expectativas
                    </h3>
                </div>
                <div class="card-body">
                    <form id="expectations-setup-form">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            Configura las preguntas que los participantes responderán el primer día.
                        </div>

                        <div class="form-group">
                            <label>Pregunta 1 - Expectativas de Aprendizaje *</label>
                            <input type="text" class="form-control" id="question1" 
                                   value="${course.expectativas && course.expectativas.preguntas ? course.expectativas.preguntas[0] : '¿Qué espero aprender en este curso?'}" 
                                   required>
                            <small class="form-text text-muted">Ej: ¿Qué habilidades/conocimientos espero adquirir?</small>
                        </div>

                        <div class="form-group">
                            <label>Pregunta 2 - Aplicación Práctica *</label>
                            <input type="text" class="form-control" id="question2" 
                                   value="${course.expectativas && course.expectativas.preguntas ? course.expectativas.preguntas[1] : '¿Cómo aplicaré estos conocimientos en mi trabajo o vida personal?'}" 
                                   required>
                            <small class="form-text text-muted">Ej: ¿En qué situaciones usaré lo aprendido?</small>
                        </div>

                        <div class="form-group">
                            <label>Pregunta 3 - Metas Personales *</label>
                            <input type="text" class="form-control" id="question3" 
                                   value="${course.expectativas && course.expectativas.preguntas ? course.expectativas.preguntas[2] : '¿Qué metas personales o profesionales espero alcanzar con este curso?'}" 
                                   required>
                            <small class="form-text text-muted">Ej: ¿Qué quiero lograr al finalizar el curso?</small>
                        </div>

                        <div class="form-group">
                            <label>Instrucciones Adicionales</label>
                            <textarea class="form-control" id="instructions" rows="3">${course.expectativas && course.expectativas.instrucciones ? course.expectativas.instrucciones : 'Por favor, comparte honestamente tus expectativas. Esto me ayudará a personalizar el curso para tus necesidades.'}</textarea>
                        </div>

                        <div class="form-group form-check">
                            <input type="checkbox" class="form-check-input" id="allowEdits" 
                                   ${course.expectativas && course.expectativas.permiteEdicion ? 'checked' : ''}>
                            <label class="form-check-label" for="allowEdits">
                                Permitir que los participantes editen sus respuestas posteriormente
                            </label>
                        </div>

                        <div class="form-group">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Guardar Configuración
                            </button>
                            <button type="button" class="btn btn-secondary" id="cancel-setup">
                                <i class="fas fa-arrow-left"></i> Volver
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `);

        $('#expectations-setup-form').on('submit', (e) => {
            e.preventDefault();
            this.saveSetup(course);
        });

        $('#cancel-setup').on('click', () => {
            this.showExpectationsManager(course);
        });
    }

    static saveSetup(course) {
        if (!course.expectativas) {
            course.expectativas = {
                respuestas: {},
                seguimientos: [],
                evaluaciones: {}
            };
        }

        course.expectativas.preguntas = [
            $('#question1').val(),
            $('#question2').val(),
            $('#question3').val()
        ];

        course.expectativas.instrucciones = $('#instructions').val();
        course.expectativas.permiteEdicion = $('#allowEdits').is(':checked');
        course.expectativas.fechaConfiguracion = new Date().toISOString();

        app.saveCourses();
        app.showNotification('Configuración de expectativas guardada', 'success');
        this.showExpectationsManager(course);
    }

    // REEMPLAZA el método showManualCollection:
    static showManualCollection(course) {
        $('#course-modules-content').html(`
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-edit"></i> Recolectar Expectativas Manualmente
                </h3>
            </div>
            <div class="card-body">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    Selecciona un participante registrado para registrar sus expectativas.
                </div>

                <div class="form-group">
                    <label>Seleccionar Participante Registrado *</label>
                    <select class="form-control" id="select-participant">
                        <option value="">-- Selecciona un participante --</option>
                        ${course.participantes ? course.participantes.filter(p => p.estado === 'activo').map(participant => `
                            <option value="${participant.id}" 
                                    ${course.expectativas && course.expectativas.respuestas && course.expectativas.respuestas[participant.id] ? 'disabled style="color: #6c757d;"' : ''}>
                                ${participant.nombre} 
                                ${participant.id ? `(${participant.id})` : ''}
                                ${course.expectativas && course.expectativas.respuestas && course.expectativas.respuestas[participant.id] ? ' - ✅ Ya respondió' : ' - ⏳ Pendiente'}
                            </option>
                        `).join('') : ''}
                        ${!course.participantes || course.participantes.length === 0 ?
                '<option value="" disabled>-- No hay participantes registrados --</option>' : ''}
                    </select>
                    <small class="form-text text-muted">
                        Solo se muestran participantes activos registrados en el curso
                    </small>
                </div>

                ${course.expectativas && course.expectativas.preguntas ? `
                    <div id="participant-info" style="display: none;" class="mb-3 p-3 border rounded bg-light">
                        <h6>Información del Participante:</h6>
                        <div id="participant-details"></div>
                    </div>

                    <form id="manual-expectations-form" style="display: none;">
                        <div class="form-group">
                            <label><strong>${course.expectativas.preguntas[0]}</strong></label>
                            <textarea class="form-control" id="manual-response1" rows="3" 
                                      placeholder="Escribe la respuesta del participante..." required></textarea>
                        </div>

                        <div class="form-group">
                            <label><strong>${course.expectativas.preguntas[1]}</strong></label>
                            <textarea class="form-control" id="manual-response2" rows="3" 
                                      placeholder="Escribe la respuesta del participante..." required></textarea>
                        </div>

                        <div class="form-group">
                            <label><strong>${course.expectativas.preguntas[2]}</strong></label>
                            <textarea class="form-control" id="manual-response3" rows="3" 
                                      placeholder="Escribe la respuesta del participante..." required></textarea>
                        </div>

                        <div class="form-group">
                            <button type="submit" class="btn btn-primary" id="save-manual-response">
                                <i class="fas fa-save"></i> Guardar Expectativas
                            </button>
                            <button type="button" class="btn btn-secondary" id="cancel-manual">
                                <i class="fas fa-arrow-left"></i> Volver
                            </button>
                        </div>
                    </form>
                ` : `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle"></i>
                        Primero debes configurar las preguntas en el módulo de expectativas.
                    </div>
                `}
            </div>
        </div>
    `);

        // Mostrar información del participante seleccionado
        $('#select-participant').on('change', function () {
            const participantId = $(this).val();
            if (participantId) {
                const participant = course.participantes.find(p => p.id === participantId);
                if (participant) {
                    $('#participant-details').html(`
                    <p><strong>Nombre:</strong> ${participant.nombre}</p>
                    <p><strong>ID:</strong> ${participant.id || 'No especificado'}</p>
                    <p><strong>Teléfono:</strong> ${participant.telefono || 'No especificado'}</p>
                    <p><strong>Email:</strong> ${participant.email || 'No especificado'}</p>
                    <p><strong>Comunidad Actual:</strong> ${participant.comunidadActual || 'No asignada'}</p>
                `);
                    $('#participant-info').show();

                    // Verificar si ya tiene expectativas
                    if (course.expectativas && course.expectativas.respuestas && course.expectativas.respuestas[participantId]) {
                        const existing = course.expectativas.respuestas[participantId];
                        $('#manual-response1').val(existing.expectativa1);
                        $('#manual-response2').val(existing.expectativa2);
                        $('#manual-response3').val(existing.expectativa3);
                        $('#save-manual-response').html('<i class="fas fa-sync"></i> Actualizar Expectativas');
                    } else {
                        $('#manual-response1').val('');
                        $('#manual-response2').val('');
                        $('#manual-response3').val('');
                        $('#save-manual-response').html('<i class="fas fa-save"></i> Guardar Expectativas');
                    }

                    $('#manual-expectations-form').show();
                }
            } else {
                $('#participant-info').hide();
                $('#manual-expectations-form').hide();
            }
        });

        if (course.expectativas && course.expectativas.preguntas) {
            $('#manual-expectations-form').on('submit', (e) => {
                e.preventDefault();
                this.saveManualResponse(course);
            });
        }

        $('#cancel-manual').on('click', () => {
            this.showExpectationsManager(course);
        });
    }

    static saveManualResponse(course) {
        const participantId = $('#select-participant').val();
        if (!participantId) {
            alert('Selecciona un participante');
            return;
        }

        const participant = course.participantes.find(p => p.id === participantId);
        if (!participant) {
            alert('Participante no encontrado');
            return;
        }

        const respuesta = {
            expectativa1: $('#manual-response1').val(),
            expectativa2: $('#manual-response2').val(),
            expectativa3: $('#manual-response3').val(),
            fechaRespuesta: new Date().toISOString(),
            metodo: 'manual',
            nombre: participant.nombre
        };

        if (!course.expectativas.respuestas) {
            course.expectativas.respuestas = {};
        }

        course.expectativas.respuestas[participantId] = respuesta;
        app.saveCourses();

        app.showNotification(`Expectativas de ${participant.nombre} guardadas correctamente`, 'success');
        this.showExpectationsManager(course);
    }
    // AGREGAR este método para validar que solo participantes registrados puedan responder
    static validarParticipanteRegistrado(course, participantId) {
        if (!course.participantes) return false;
        return course.participantes.some(p => p.id === participantId && p.estado === 'activo');
    }

    // MODIFICAR el método cargarRespuestasQR:
    static cargarRespuestasQR(course) {
        if (!course.expectativas) {
            course.expectativas = { respuestas: {} };
        }
        if (!course.expectativas.respuestas) {
            course.expectativas.respuestas = {};
        }

        const allExpectations = JSON.parse(localStorage.getItem('infotep-expectations') || '[]');
        let nuevas = 0;

        allExpectations.forEach(exp => {
            // Solo cargar si el participante está registrado en el curso
            if (exp.courseId === course.id && this.validarParticipanteRegistrado(course, exp.participantId)) {
                if (!course.expectativas.respuestas[exp.participantId]) {
                    const participant = course.participantes.find(p => p.id === exp.participantId);
                    course.expectativas.respuestas[exp.participantId] = {
                        expectativa1: exp.expectation1,
                        expectativa2: exp.expectation2,
                        expectativa3: exp.expectation3,
                        fechaRespuesta: exp.timestamp,
                        metodo: 'qr',
                        nombre: participant ? participant.nombre : 'Participante'
                    };
                    nuevas++;
                }
            }
        });

        if (nuevas > 0) {
            app.saveCourses();
        }

        return nuevas;
    }
    static showAllResponses(course) {
        if (!course.expectativas || !course.expectativas.respuestas || Object.keys(course.expectativas.respuestas).length === 0) {
            app.showNotification('No hay respuestas para mostrar', 'warning');
            return;
        }

        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-table"></i> Todas las Respuestas de Expectativas
                        <span class="badge badge-info ml-2">${Object.keys(course.expectativas.respuestas).length} respuestas</span>
                    </h3>
                    <div class="card-tools">
                        <button class="btn btn-success btn-sm" id="export-expectations-btn">
                            <i class="fas fa-download"></i> Exportar
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>Participante</th>
                                    <th>${course.expectativas.preguntas ? course.expectativas.preguntas[0] : 'Expectativa 1'}</th>
                                    <th>${course.expectativas.preguntas ? course.expectativas.preguntas[1] : 'Expectativa 2'}</th>
                                    <th>${course.expectativas.preguntas ? course.expectativas.preguntas[2] : 'Expectativa 3'}</th>
                                    <th>Fecha</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(course.expectativas.respuestas).map(([participantId, respuesta]) => {
            const participant = course.participantes.find(p => p.id === participantId);
            const nombre = participant ? participant.nombre : (respuesta.nombre || 'N/A');
            return `
                                        <tr>
                                            <td><strong>${nombre}</strong></td>
                                            <td><small>${respuesta.expectativa1}</small></td>
                                            <td><small>${respuesta.expectativa2}</small></td>
                                            <td><small>${respuesta.expectativa3}</small></td>
                                            <td><small>${new Date(respuesta.fechaRespuesta).toLocaleDateString()}</small></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary view-response" 
                                                        data-participant-id="${participantId}">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger delete-response" 
                                                        data-participant-id="${participantId}">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `;
        }).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="mt-3">
                        <button class="btn btn-secondary" id="back-from-responses">
                            <i class="fas fa-arrow-left"></i> Volver
                        </button>
                    </div>
                </div>
            </div>
        `);

        this.bindResponsesEvents(course);
    }

    static bindResponsesEvents(course) {
        $('.view-response').on('click', function () {
            const participantId = $(this).data('participant-id');
            ExpectationsManager.showResponseDetails(course, participantId);
        });

        $('.delete-response').on('click', function () {
            const participantId = $(this).data('participant-id');
            ExpectationsManager.deleteResponse(course, participantId);
        });

        $('#export-expectations-btn').on('click', () => {
            this.exportExpectations(course);
        });

        $('#back-from-responses').on('click', () => {
            this.showExpectationsManager(course);
        });
    }

    static showResponseDetails(course, participantId) {
        const respuesta = course.expectativas.respuestas[participantId];
        const participant = course.participantes.find(p => p.id === participantId);

        if (!respuesta) return;

        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-eye"></i> Detalles de Expectativas
                    </h3>
                </div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h5>Información del Participante</h5>
                            <p><strong>Nombre:</strong> ${participant ? participant.nombre : (respuesta.nombre || 'N/A')}</p>
                            <p><strong>ID:</strong> ${participant ? (participant.id || 'N/A') : 'N/A'}</p>
                            <p><strong>Fecha de respuesta:</strong> ${new Date(respuesta.fechaRespuesta).toLocaleString()}</p>
                            <p><strong>Método:</strong> ${respuesta.metodo || 'N/A'}</p>
                        </div>
                    </div>

                    <h5>Respuestas:</h5>
                    <div class="card mb-3">
                        <div class="card-header bg-light">
                            <strong>${course.expectativas.preguntas ? course.expectativas.preguntas[0] : 'Expectativa 1'}</strong>
                        </div>
                        <div class="card-body">
                            <p>${respuesta.expectativa1}</p>
                        </div>
                    </div>

                    <div class="card mb-3">
                        <div class="card-header bg-light">
                            <strong>${course.expectativas.preguntas ? course.expectativas.preguntas[1] : 'Expectativa 2'}</strong>
                        </div>
                        <div class="card-body">
                            <p>${respuesta.expectativa2}</p>
                        </div>
                    </div>

                    <div class="card mb-3">
                        <div class="card-header bg-light">
                            <strong>${course.expectativas.preguntas ? course.expectativas.preguntas[2] : 'Expectativa 3'}</strong>
                        </div>
                        <div class="card-body">
                            <p>${respuesta.expectativa3}</p>
                        </div>
                    </div>

                    <div class="mt-3">
                        <button class="btn btn-secondary" id="back-from-details">
                            <i class="fas fa-arrow-left"></i> Volver
                        </button>
                    </div>
                </div>
            </div>
        `);

        $('#back-from-details').on('click', () => {
            this.showAllResponses(course);
        });
    }

    static deleteResponse(course, participantId) {
        const participant = course.participantes.find(p => p.id === participantId);
        const nombre = participant ? participant.nombre : 'Este participante';

        if (confirm(`¿Estás seguro de que quieres eliminar las expectativas de ${nombre}?`)) {
            delete course.expectativas.respuestas[participantId];
            app.saveCourses();
            app.showNotification('Expectativas eliminadas correctamente', 'success');
            this.showAllResponses(course);
        }
    }

    static exportExpectations(course) {
        if (!course.expectativas || !course.expectativas.respuestas) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Participante,ID,Pregunta 1,Pregunta 2,Pregunta 3,Fecha,Método\n";

        Object.entries(course.expectativas.respuestas).forEach(([participantId, respuesta]) => {
            const participant = course.participantes.find(p => p.id === participantId);
            const row = [
                participant ? participant.nombre : (respuesta.nombre || ''),
                participant ? (participant.id || '') : '',
                `"${respuesta.expectativa1.replace(/"/g, '""')}"`,
                `"${respuesta.expectativa2.replace(/"/g, '""')}"`,
                `"${respuesta.expectativa3.replace(/"/g, '""')}"`,
                new Date(respuesta.fechaRespuesta).toLocaleDateString(),
                respuesta.metodo || ''
            ].join(',');

            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `expectativas_${course.codigo}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    static cargarRespuestasQR(course) {
        if (!course.expectativas) {
            course.expectativas = { respuestas: {} };
        }
        if (!course.expectativas.respuestas) {
            course.expectativas.respuestas = {};
        }

        const allExpectations = JSON.parse(localStorage.getItem('infotep-expectations') || '[]');
        const courseExpectations = allExpectations.filter(exp => exp.courseId === course.id);
        let nuevas = 0;

        courseExpectations.forEach(exp => {
            if (!course.expectativas.respuestas[exp.participantId]) {
                course.expectativas.respuestas[exp.participantId] = {
                    expectativa1: exp.expectation1,
                    expectativa2: exp.expectation2,
                    expectativa3: exp.expectation3,
                    fechaRespuesta: exp.timestamp,
                    metodo: 'qr',
                    nombre: exp.participantName
                };
                nuevas++;
            }
        });

        if (nuevas > 0) {
            app.saveCourses();
        }

        return nuevas;
    }

    static showCheckpointsSetup(course) {
        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-calendar-check"></i> Configurar Checkpoints de Seguimiento
                    </h3>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        Los checkpoints te permiten hacer seguimiento del progreso de las expectativas durante el curso.
                    </div>
                    <p class="text-center text-muted py-4">
                        <i class="fas fa-tools fa-2x mb-3"></i><br>
                        Módulo en desarrollo - Próximamente
                    </p>
                    <div class="text-center">
                        <button class="btn btn-secondary" id="back-from-checkpoints">
                            <i class="fas fa-arrow-left"></i> Volver
                        </button>
                    </div>
                </div>
            </div>
        `);

        $('#back-from-checkpoints').on('click', () => {
            this.showExpectationsManager(course);
        });
    }

    static showFinalEvaluation(course) {
        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-clipboard-check"></i> Evaluación Final de Expectativas
                    </h3>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        Evalúa el cumplimiento de las expectativas al final del curso.
                    </div>
                    <p class="text-center text-muted py-4">
                        <i class="fas fa-tools fa-2x mb-3"></i><br>
                        Módulo en desarrollo - Próximamente
                    </p>
                    <div class="text-center">
                        <button class="btn btn-secondary" id="back-from-evaluation">
                            <i class="fas fa-arrow-left"></i> Volver
                        </button>
                    </div>
                </div>
            </div>
        `);

        $('#back-from-evaluation').on('click', () => {
            this.showExpectationsManager(course);
        });
    }
}

// Hacer disponible globalmente
window.ExpectationsManager = ExpectationsManager;