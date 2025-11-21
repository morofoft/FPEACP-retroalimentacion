// Sistema de Rotación Semanal Inteligente
class RotationManager {
    static showRotationManager(course) {
        const semanaActual = this.calcularSemanaActual(course);
        const participantesPorComunidad = this.distribuirParticipantes(course, semanaActual);
        
        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-sync-alt"></i> Rotación Semanal
                        <span class="badge badge-info ml-2">Semana ${semanaActual}</span>
                    </h3>
                    <div class="card-tools">
                        <button class="btn btn-success btn-sm" id="apply-rotation-btn">
                            <i class="fas fa-play-circle"></i> Aplicar Rotación
                        </button>
                        <button class="btn btn-warning btn-sm" id="manual-adjust-btn">
                            <i class="fas fa-edit"></i> Ajuste Manual
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> 
                        <strong>Rotación Automática:</strong> Semana ${semanaActual} de ${course.duracion} semanas.
                        ${course.fechaInicio ? `Inició: ${new Date(course.fechaInicio).toLocaleDateString()}` : ''}
                    </div>

                    <div class="row">
                        ${course.comunidadesPrincipales.map(comunidad => {
                            const participantes = participantesPorComunidad[comunidad.id] || [];
                            return `
                                <div class="col-md-4">
                                    <div class="card">
                                        <div class="card-header" style="background-color: ${comunidad.color}20; border-left: 4px solid ${comunidad.color}">
                                            <h5 class="card-title mb-0">
                                                <i class="fas fa-users"></i> ${comunidad.nombre}
                                                <span class="badge badge-light float-right">${participantes.length}</span>
                                            </h5>
                                        </div>
                                        <div class="card-body">
                                            ${participantes.length > 0 ? `
                                                <div class="participants-list" style="max-height: 300px; overflow-y: auto;">
                                                    ${participantes.map(participant => `
                                                        <div class="participant-item mb-2 p-2 border rounded">
                                                            <strong>${participant.nombre}</strong>
                                                            ${participant.id ? `<br><small class="text-muted">${participant.id}</small>` : ''}
                                                        </div>
                                                    `).join('')}
                                                </div>
                                            ` : `
                                                <div class="text-center text-muted py-3">
                                                    <i class="fas fa-user-slash fa-2x mb-2"></i>
                                                    <p>No hay participantes asignados</p>
                                                </div>
                                            `}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="row mt-4">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title mb-0">
                                        <i class="fas fa-history"></i> Historial de Rotaciones
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <div class="table-responsive">
                                        <table class="table table-bordered table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Semana</th>
                                                    <th>Fecha</th>
                                                    <th>Feedback</th>
                                                    <th>Dinámica</th>
                                                    <th>Orden y Limpieza</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${this.generarHistorialRotaciones(course, semanaActual)}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.bindRotationEvents(course, semanaActual);
    }

    static calcularSemanaActual(course) {
        if (!course.fechaInicio) return 1;
        
        const fechaInicio = new Date(course.fechaInicio);
        const hoy = new Date();
        
        // Calcular diferencia en semanas
        const diffTiempo = hoy.getTime() - fechaInicio.getTime();
        const diffSemanas = Math.floor(diffTiempo / (1000 * 60 * 60 * 24 * 7)) + 1;
        
        // Asegurar que esté dentro del rango del curso
        return Math.max(1, Math.min(diffSemanas, course.duracion));
    }

    static distribuirParticipantes(course, semana) {
        if (!course.participantes || course.participantes.length === 0) {
            return {};
        }

        const participantes = course.participantes.filter(p => p.estado === 'activo');
        const totalParticipantes = participantes.length;
        const comunidades = course.comunidadesPrincipales;
        
        // Calcular participantes por comunidad
        const basePorComunidad = Math.floor(totalParticipantes / comunidades.length);
        let resto = totalParticipantes % comunidades.length;
        
        const distribucion = {};
        comunidades.forEach((comunidad, index) => {
            let cantidad = basePorComunidad;
            if (index < resto) cantidad++;
            
            distribucion[comunidad.id] = cantidad;
        });

        // Aplicar rotación circular
        const participantesRotados = [];
        const rotacion = (semana - 1) % comunidades.length;
        
        // Reorganizar participantes según la rotación
        comunidades.forEach((comunidad, indexComunidad) => {
            const indiceDestino = (indexComunidad + rotacion) % comunidades.length;
            const cantidad = distribucion[comunidades[indiceDestino].id];
            
            const inicio = indexComunidad === 0 ? 0 : 
                comunidades.slice(0, indexComunidad).reduce((sum, com) => sum + distribucion[com.id], 0);
            
            const fin = inicio + cantidad;
            const participantesComunidad = participantes.slice(inicio, fin);
            
            participantesRotados.push(...participantesComunidad.map(p => ({
                ...p,
                comunidadRotacion: comunidades[indiceDestino].id
            })));
        });

        // Agrupar por comunidad final
        const resultado = {};
        comunidades.forEach(comunidad => {
            resultado[comunidad.id] = participantesRotados.filter(p => 
                p.comunidadRotacion === comunidad.id
            );
        });

        return resultado;
    }

    static generarHistorialRotaciones(course, semanaActual) {
        let html = '';
        const semanasMostrar = Math.min(8, course.duracion); // Mostrar máximo 8 semanas
        
        for (let semana = 1; semana <= semanasMostrar; semana++) {
            const distribucion = this.distribuirParticipantes(course, semana);
            const esSemanaActual = semana === semanaActual;
            
            html += `
                <tr class="${esSemanaActual ? 'table-active' : ''}">
                    <td>
                        ${semana}
                        ${esSemanaActual ? '<span class="badge badge-primary ml-1">Actual</span>' : ''}
                    </td>
                    <td>${this.calcularFechaSemana(course, semana)}</td>
                    ${course.comunidadesPrincipales.map(comunidad => `
                        <td>${distribucion[comunidad.id] ? distribucion[comunidad.id].length : 0}</td>
                    `).join('')}
                </tr>
            `;
        }
        
        return html;
    }

    static calcularFechaSemana(course, semana) {
        if (!course.fechaInicio) return 'N/A';
        
        const fechaInicio = new Date(course.fechaInicio);
        const fechaSemana = new Date(fechaInicio);
        fechaSemana.setDate(fechaInicio.getDate() + (semana - 1) * 7);
        
        return fechaSemana.toLocaleDateString();
    }

    static bindRotationEvents(course, semanaActual) {
        // Aplicar rotación
        $('#apply-rotation-btn').on('click', () => {
            this.aplicarRotacion(course, semanaActual);
        });

        // Ajuste manual
        $('#manual-adjust-btn').on('click', () => {
            this.mostrarAjusteManual(course, semanaActual);
        });
    }

    static aplicarRotacion(course, semana) {
        if (!course.participantes || course.participantes.length === 0) {
            alert('No hay participantes para aplicar la rotación');
            return;
        }

        const distribucion = this.distribuirParticipantes(course, semana);
        
        // Actualizar participantes con su nueva comunidad
        course.participantes.forEach(participant => {
            if (participant.estado === 'activo') {
                // Encontrar en qué comunidad quedó
                for (const [comunidadId, participantes] of Object.entries(distribucion)) {
                    if (participantes.find(p => p.id === participant.id)) {
                        // Registrar en historial si cambió de comunidad
                        if (participant.comunidadActual !== comunidadId) {
                            if (!participant.historialComunidades) {
                                participant.historialComunidades = [];
                            }
                            
                            participant.historialComunidades.push({
                                comunidad: comunidadId,
                                fechaAsignacion: new Date().toISOString(),
                                tipo: 'rotacion_automatica',
                                semana: semana
                            });
                        }
                        
                        participant.comunidadActual = comunidadId;
                        break;
                    }
                }
            }
        });

        // Actualizar rotación actual del curso
        course.rotacionActual = semana;
        app.saveCourses();
        
        app.showNotification(`Rotación aplicada - Semana ${semana}`, 'success');
        this.showRotationManager(course);
    }

    static mostrarAjusteManual(course, semanaActual) {
        const distribucion = this.distribuirParticipantes(course, semanaActual);
        
        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-edit"></i> Ajuste Manual de Rotación - Semana ${semanaActual}
                    </h3>
                </div>
                <div class="card-body">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Atención:</strong> Los cambios manuales afectarán la rotación automática futura.
                    </div>

                    <div class="row">
                        ${course.comunidadesPrincipales.map(comunidad => {
                            const participantes = distribucion[comunidad.id] || [];
                            return `
                                <div class="col-md-4">
                                    <div class="card">
                                        <div class="card-header" style="background-color: ${comunidad.color}20; border-left: 4px solid ${comunidad.color}">
                                            <h5 class="card-title mb-0">
                                                ${comunidad.nombre}
                                                <span class="badge badge-light float-right">${participantes.length}</span>
                                            </h5>
                                        </div>
                                        <div class="card-body">
                                            <div class="participants-draggable" data-comunidad="${comunidad.id}" 
                                                 style="min-height: 200px; max-height: 400px; overflow-y: auto; border: 2px dashed #dee2e6; padding: 10px; border-radius: 5px;">
                                                ${participantes.map(participant => `
                                                    <div class="participant-draggable mb-2 p-2 border rounded bg-light" 
                                                         data-participant-id="${participant.id}"
                                                         draggable="true">
                                                        <strong>${participant.nombre}</strong>
                                                        ${participant.id ? `<br><small class="text-muted">${participant.id}</small>` : ''}
                                                        <small class="float-right text-muted">
                                                            <i class="fas fa-arrows-alt"></i>
                                                        </small>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="row mt-4">
                        <div class="col-12">
                            <div class="alert alert-info">
                                <i class="fas fa-mouse-pointer"></i> 
                                <strong>Instrucciones:</strong> Arrastra participantes entre comunidades para ajustar manualmente.
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-12 text-center">
                            <button class="btn btn-primary" id="save-manual-adjustment">
                                <i class="fas fa-save"></i> Guardar Ajustes Manuales
                            </button>
                            <button class="btn btn-secondary" id="cancel-manual-adjustment">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.configurarDragAndDrop();
        this.bindManualAdjustEvents(course, semanaActual);
    }

    static configurarDragAndDrop() {
        // Implementación básica de drag and drop
        $('.participant-draggable').on('dragstart', function(e) {
            e.originalEvent.dataTransfer.setData('text/plain', $(this).data('participant-id'));
        });

        $('.participants-draggable').on('dragover', function(e) {
            e.preventDefault();
            $(this).addClass('bg-light');
        });

        $('.participants-draggable').on('dragleave', function() {
            $(this).removeClass('bg-light');
        });

        $('.participants-draggable').on('drop', function(e) {
            e.preventDefault();
            $(this).removeClass('bg-light');
            
            const participantId = e.originalEvent.dataTransfer.getData('text/plain');
            const nuevaComunidad = $(this).data('comunidad');
            
            // Mover el elemento visualmente
            const participantElement = $(`.participant-draggable[data-participant-id="${participantId}"]`);
            $(this).append(participantElement);
        });
    }

    static bindManualAdjustEvents(course, semanaActual) {
        $('#save-manual-adjustment').on('click', () => {
            this.guardarAjusteManual(course, semanaActual);
        });

        $('#cancel-manual-adjustment').on('click', () => {
            this.showRotationManager(course);
        });
    }

    static guardarAjusteManual(course, semanaActual) {
        // Recopilar la nueva distribución
        const nuevaDistribucion = {};
        
        $('.participants-draggable').each(function() {
            const comunidadId = $(this).data('comunidad');
            const participantesIds = [];
            
            $(this).find('.participant-draggable').each(function() {
                participantesIds.push($(this).data('participant-id'));
            });
            
            nuevaDistribucion[comunidadId] = participantesIds;
        });

        // Actualizar participantes
        Object.entries(nuevaDistribucion).forEach(([comunidadId, participantesIds]) => {
            participantesIds.forEach(participantId => {
                const participant = course.participantes.find(p => p.id === participantId);
                if (participant && participant.comunidadActual !== comunidadId) {
                    // Registrar cambio en historial
                    if (!participant.historialComunidades) {
                        participant.historialComunidades = [];
                    }
                    
                    participant.historialComunidades.push({
                        comunidad: comunidadId,
                        fechaAsignacion: new Date().toISOString(),
                        tipo: 'ajuste_manual',
                        semana: semanaActual
                    });
                    
                    participant.comunidadActual = comunidadId;
                }
            });
        });

        app.saveCourses();
        app.showNotification('Ajustes manuales guardados correctamente', 'success');
        this.showRotationManager(course);
    }
}

// Hacer disponible globalmente
window.RotationManager = RotationManager;