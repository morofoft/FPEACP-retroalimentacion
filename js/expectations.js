// Módulo de Gestión de Expectativas
class ExpectationsManager {
    static showExpectationsManager(course) {
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
                            <i class="fas fa-cog"></i> Configurar Expectativas
                        </button>
                        <button class="btn btn-primary btn-sm" id="view-responses-btn">
                            <i class="fas fa-chart-bar"></i> Ver Reportes
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
                                        <div class="spinner-border" role="status">
                                            <span class="sr-only">Generando QR...</span>
                                        </div>
                                    </div>
                                    <p class="text-muted">
                                        Los participantes pueden escanear este código para registrar sus expectativas
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
                                        <i class="fas fa-edit"></i> Recolectar Expectativas Manualmente
                                    </button>
                                    <button class="btn btn-warning btn-block mb-2" id="setup-checkpoints-btn">
                                        <i class="fas fa-calendar-check"></i> Configurar Checkpoints
                                    </button>
                                    <button class="btn btn-success btn-block mb-2" id="run-evaluation-btn">
                                        <i class="fas fa-clipboard-check"></i> Ejecutar Evaluación Final
                                    </button>
                                    <button class="btn btn-secondary btn-block" id="view-all-responses-btn">
                                        <i class="fas fa-table"></i> Ver Todas las Respuestas
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
        if (!course.expectativas) return 0;
        return course.expectativas.respuestas ? Object.keys(course.expectativas.respuestas).length : 0;
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
        if (!course.expectativas || !course.expectativas.respuestas) {
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

        // Análisis simple de palabras clave en expectativas
        const palabrasClave = this.analizarPalabrasClave(course);
        
        return `
            <div class="row">
                <div class="col-md-6">
                    <h6>Palabras Clave Más Frecuentes:</h6>
                    <div class="mb-3">
                        ${palabrasClave.slice(0, 8).map(([palabra, count]) => `
                            <span class="badge badge-primary mr-1 mb-1">
                                ${palabra} <span class="badge badge-light">${count}</span>
                            </span>
                        `).join('')}
                    </div>
                    
                    <h6>Estado de Participantes:</h6>
                    <div class="progress mb-2">
                        <div class="progress-bar bg-success" style="width: ${this.getPorcentajeCompletado(course)}%">
                            ${this.getPorcentajeCompletado(course)}%
                        </div>
                    </div>
                    <small class="text-muted">
                        ${this.getRespuestasCount(course)} de ${course.participantes ? course.participantes.length : 0} participantes han respondido
                    </small>
                </div>
                
                <div class="col-md-6">
                    <h6>Participantes Sin Responder:</h6>
                    <div style="max-height: 150px; overflow-y: auto;">
                        ${this.getParticipantesSinResponder(course).map(participant => `
                            <div class="mb-1">
                                <small class="text-muted">• ${participant.nombre}</small>
                            </div>
                        `).join('')}
                        ${this.getParticipantesSinResponder(course).length === 0 ? 
                            '<small class="text-success">¡Todos han respondido!</small>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    static analizarPalabrasClave(course) {
        const palabrasComunes = ['aprender', 'conocer', 'desarrollar', 'mejorar', 'aplicar', 'entender', 'lograr'];
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

    static getParticipantesSinResponder(course) {
        if (!course.participantes || !course.expectativas || !course.expectativas.respuestas) {
            return course.participantes || [];
        }
        
        return course.participantes.filter(participant => 
            !course.expectativas.respuestas[participant.id]
        );
    }

    static generarQRCode(course) {
        // Simular generación de QR (en realidad sería un enlace único)
        setTimeout(() => {
            const qrUrl = `${window.location.origin}${window.location.pathname}?course=${course.id}&module=expectations`;
            $('#qrcode-container').html(`
                <div class="text-center">
                    <div style="width: 200px; height: 200px; background: #f8f9fa; border: 2px dashed #dee2e6; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px;">
                        <div class="text-center">
                            <i class="fas fa-qrcode fa-3x text-muted mb-2"></i>
                            <br>
                            <small class="text-muted">Código QR</small>
                        </div>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">Enlace: ${qrUrl}</small>
                    </div>
                </div>
            `);
        }, 1000);
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

    static showManualCollection(course) {
        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-edit"></i> Recolectar Expectativas Manualmente
                    </h3>
                </div>
                <div class="card-body">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        Registra las expectativas de participantes que no puedan usar el código QR.
                    </div>

                    <div class="form-group">
                        <label>Seleccionar Participante *</label>
                        <select class="form-control" id="select-participant">
                            <option value="">-- Selecciona un participante --</option>
                            ${this.getParticipantesSinResponder(course).map(participant => `
                                <option value="${participant.id}">${participant.nombre} ${participant.id ? `(${participant.id})` : ''}</option>
                            `).join('')}
                        </select>
                    </div>

                    ${course.expectativas && course.expectativas.preguntas ? `
                        <form id="manual-expectations-form">
                            <div class="form-group">
                                <label>${course.expectativas.preguntas[0]}</label>
                                <textarea class="form-control" id="manual-response1" rows="2" required></textarea>
                            </div>

                            <div class="form-group">
                                <label>${course.expectativas.preguntas[1]}</label>
                                <textarea class="form-control" id="manual-response2" rows="2" required></textarea>
                            </div>

                            <div class="form-group">
                                <label>${course.expectativas.preguntas[2]}</label>
                                <textarea class="form-control" id="manual-response3" rows="2" required></textarea>
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
                            Primero debes configurar las preguntas en el módulo de expectativas.
                        </div>
                    `}
                </div>
            </div>
        `);

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

        const respuesta = {
            expectativa1: $('#manual-response1').val(),
            expectativa2: $('#manual-response2').val(),
            expectativa3: $('#manual-response3').val(),
            fechaRespuesta: new Date().toISOString(),
            metodo: 'manual'
        };

        if (!course.expectativas.respuestas) {
            course.expectativas.respuestas = {};
        }

        course.expectativas.respuestas[participantId] = respuesta;
        app.saveCourses();
        
        app.showNotification('Expectativas guardadas correctamente', 'success');
        this.showExpectationsManager(course);
    }
}

// Hacer disponible globalmente
window.ExpectationsManager = ExpectationsManager;