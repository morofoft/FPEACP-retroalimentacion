// Gestión de Comunidades Temporales por Actividad
class CommunitiesManager {
    static showCommunitiesManager(course) {
        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-layer-group"></i> Gestión de Comunidades
                        <span class="badge badge-primary ml-2">${course.comunidadesTemporales ? course.comunidadesTemporales.length : 0} temporales</span>
                    </h3>
                    <div class="card-tools">
                        <button class="btn btn-success btn-sm" id="create-temporal-community-btn">
                            <i class="fas fa-plus-circle"></i> Nueva Comunidad Temporal
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Comunidades Principales Fijas -->
                    <div class="row mb-4">
                        <div class="col-12">
                            <h5>
                                <i class="fas fa-star text-warning"></i> 
                                Comunidades Principales (Fijas)
                            </h5>
                            <div class="row">
                                ${course.comunidadesPrincipales.map(comunidad => {
            const participantesCount = course.participantes ?
                course.participantes.filter(p => p.comunidadActual === comunidad.id && p.estado === 'activo').length : 0;
            return `
                                        <div class="col-md-4">
                                            <div class="card">
                                                <div class="card-header" style="background-color: ${comunidad.color}20; border-left: 4px solid ${comunidad.color}">
                                                    <h6 class="card-title mb-0">
                                                        ${comunidad.nombre}
                                                        <span class="badge badge-light float-right">${participantesCount}</span>
                                                    </h6>
                                                </div>
                                                <div class="card-body">
                                                    <p class="card-text text-muted">${comunidad.descripcion || 'Comunidad principal del curso'}</p>
                                                    <small class="text-muted">
                                                        <i class="fas fa-users"></i> ${participantesCount} participantes activos
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    `;
        }).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Comunidades Temporales -->
                    <div class="row">
                        <div class="col-12">
                            <h5>
                                <i class="fas fa-clock text-info"></i> 
                                Comunidades Temporales por Actividad
                            </h5>
                            
                            ${(!course.comunidadesTemporales || course.comunidadesTemporales.length === 0) ? `
                                <div class="text-center py-4">
                                    <i class="fas fa-layer-group fa-3x text-muted mb-3"></i>
                                    <h4>No hay comunidades temporales</h4>
                                    <p class="text-muted">Crea comunidades temporales para actividades específicas</p>
                                    <button class="btn btn-primary" id="create-first-temporal-community">
                                        <i class="fas fa-plus-circle"></i> Crear Primera Comunidad Temporal
                                    </button>
                                </div>
                            ` : `
                                <div class="row" id="temporal-communities-list">
                                    <!-- Las comunidades temporales se cargarán aquí -->
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `);

        if (course.comunidadesTemporales && course.comunidadesTemporales.length > 0) {
            this.renderTemporalCommunities(course);
        }

        this.bindCommunitiesEvents(course);
    }

    // AGREGAR ESTOS MÉTODOS NUEVOS en CommunitiesManager:

    static calcularDistribucionComunidades(course, participantesPorComunidad, fechaActividad) {
        const participantesActivos = course.participantes.filter(p => p.estado === 'activo');

        // Filtrar participantes que YA están en comunidades de la misma fecha
        const participantesOcupados = new Set();
        if (course.comunidadesTemporales) {
            course.comunidadesTemporales.forEach(comunidad => {
                if (comunidad.fechaActividad === fechaActividad && comunidad.participantes) {
                    comunidad.participantes.forEach(participantId => {
                        participantesOcupados.add(participantId);
                    });
                }
            });
        }

        // Participantes disponibles (no ocupados en misma fecha)
        const participantesDisponibles = participantesActivos.filter(p =>
            !participantesOcupados.has(p.id)
        );

        if (participantesDisponibles.length === 0) {
            throw new Error('No hay participantes disponibles para la fecha seleccionada. Todos ya están asignados en otras comunidades de esta fecha.');
        }

        // Calcular número de comunidades necesarias
        const numeroComunidades = Math.ceil(participantesDisponibles.length / participantesPorComunidad);

        return {
            participantesDisponibles,
            numeroComunidades,
            participantesPorComunidad,
            totalParticipantes: participantesDisponibles.length
        };
    }

    static crearComunidadesAutomaticas(course, communityData) {
        const { participantesPorComunidad, fechaActividad, prefijo = 'Grupo' } = communityData;

        // Calcular distribución
        const distribucion = this.calcularDistribucionComunidades(course, participantesPorComunidad, fechaActividad);

        if (distribucion.participantesDisponibles.length < participantesPorComunidad) {
            throw new Error(`No hay suficientes participantes disponibles. Necesitas ${participantesPorComunidad} pero solo hay ${distribucion.participantesDisponibles.length} disponibles para esta fecha.`);
        }

        // Mezclar participantes disponibles
        const participantesMezclados = [...distribucion.participantesDisponibles].sort(() => 0.5 - Math.random());

        const nuevasComunidades = [];

        // Crear cada comunidad
        for (let i = 0; i < distribucion.numeroComunidades; i++) {
            const inicio = i * participantesPorComunidad;
            const fin = inicio + participantesPorComunidad;
            const participantesComunidad = participantesMezclados.slice(inicio, fin).map(p => p.id);

            // Solo crear comunidad si tiene participantes
            if (participantesComunidad.length > 0) {
                const nuevaComunidad = {
                    id: 'temp-com-' + Date.now() + '-' + i,
                    nombre: `${prefijo} ${i + 1}`,
                    descripcion: communityData.descripcion || `Comunidad temporal para actividad del ${fechaActividad}`,
                    fechaActividad: fechaActividad,
                    participantes: participantesComunidad,
                    fechaCreacion: new Date().toISOString(),
                    tipo: 'temporal',
                    participantesPorComunidad: participantesPorComunidad
                };

                nuevasComunidades.push(nuevaComunidad);
            }
        }

        return nuevasComunidades;
    }

    static renderTemporalCommunities(course) {
        const container = $('#temporal-communities-list');
        container.empty();

        // Ordenar por fecha (más recientes primero)
        const comunidadesOrdenadas = [...course.comunidadesTemporales].sort((a, b) =>
            new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
        );

        comunidadesOrdenadas.forEach(comunidad => {
            const participantesCount = comunidad.participantes ? comunidad.participantes.length : 0;
            const fechaCreacion = new Date(comunidad.fechaCreacion).toLocaleDateString();

            const comunidadCard = $(`
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="card-title mb-0">
                                <i class="fas fa-users"></i> ${comunidad.nombre}
                            </h6>
                            <span class="badge badge-info">${participantesCount} participantes</span>
                        </div>
                        <div class="card-body">
                            <p class="card-text">${comunidad.descripcion || 'Sin descripción'}</p>
                            
                            <div class="mb-2">
                                <small class="text-muted">
                                    <i class="fas fa-calendar"></i> Creada: ${fechaCreacion}
                                </small>
                            </div>

                            ${comunidad.fechaActividad ? `
                                <div class="mb-2">
                                    <small class="text-muted">
                                        <i class="fas fa-clock"></i> Actividad: ${new Date(comunidad.fechaActividad).toLocaleDateString()}
                                    </small>
                                </div>
                            ` : ''}

                            <div class="participants-preview">
                                ${comunidad.participantes && comunidad.participantes.length > 0 ? `
                                    <small class="text-muted">Participantes:</small>
                                    <div style="max-height: 100px; overflow-y: auto;">
                                        ${comunidad.participantes.map(participantId => {
                const participant = course.participantes.find(p => p.id === participantId);
                return participant ? `
                                                <span class="badge badge-light mr-1 mb-1">${participant.nombre}</span>
                                            ` : '';
            }).join('')}
                                    </div>
                                ` : `
                                    <small class="text-muted">Sin participantes asignados</small>
                                `}
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="btn-group btn-group-sm w-100">
                                <button class="btn btn-outline-primary manage-participants" 
                                        data-community-id="${comunidad.id}">
                                    <i class="fas fa-user-edit"></i> Gestionar
                                </button>
                                <button class="btn btn-outline-info view-details" 
                                        data-community-id="${comunidad.id}">
                                    <i class="fas fa-eye"></i> Ver
                                </button>
                                <button class="btn btn-outline-danger delete-community" 
                                        data-community-id="${comunidad.id}">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            container.append(comunidadCard);
        });

        this.bindTemporalCommunitiesEvents(course);
    }

    static bindCommunitiesEvents(course) {
        // Crear comunidad temporal
        $('#create-temporal-community-btn, #create-first-temporal-community').on('click', () => {
            this.showCreateTemporalCommunityForm(course);
        });
    }

    // AGREGAR después de bindCommunitiesEvents:

static actualizarCalculoComunidades(course) {
    const participantesPorComunidad = parseInt($('#community-participants-count').val()) || 5;
    const fechaActividad = $('#community-activity-date').val();
    
    if (!fechaActividad) {
        $('#communities-count-display').text('Ingresa fecha primero');
        return;
    }
    
    try {
        const distribucion = this.calcularDistribucionComunidades(course, participantesPorComunidad, fechaActividad);
        
        $('#communities-count-display').html(`
            <strong>${distribucion.numeroComunidades} comunidades</strong>
            <br>
            <small class="text-muted">
                ${distribucion.totalParticipantes} participantes disponibles
            </small>
        `);
    } catch (error) {
        $('#communities-count-display').html(`
            <strong class="text-danger">Error</strong>
            <br>
            <small class="text-danger">${error.message}</small>
        `);
    }
}


    static bindTemporalCommunitiesEvents(course) {
        // Gestionar participantes
        $('.manage-participants').on('click', function () {
            const communityId = $(this).data('community-id');
            CommunitiesManager.showManageParticipants(course, communityId);
        });

        // Ver detalles
        $('.view-details').on('click', function () {
            const communityId = $(this).data('community-id');
            CommunitiesManager.showCommunityDetails(course, communityId);
        });

        // Eliminar comunidad
        $('.delete-community').on('click', function () {
            const communityId = $(this).data('community-id');
            CommunitiesManager.deleteTemporalCommunity(course, communityId);
        });
    }

    static showCreateTemporalCommunityForm(course) {
        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-plus-circle"></i> Crear Comunidades Temporales
                    </h3>
                </div>
                <div class="card-body">
                    <form id="create-temporal-community-form">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Nombre de la Actividad *</label>
                                    <input type="text" class="form-control" id="community-name" 
                                           placeholder="Ej: Proyecto Final, Investigación Grupal..." required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Fecha de Actividad *</label>
                                    <input type="date" class="form-control" id="community-activity-date" required>
                                    <small class="form-text text-muted">
                                        Los participantes no podrán repetirse en comunidades de la misma fecha
                                    </small>
                                </div>
                            </div>
                        </div>
    
                        <div class="form-group">
                            <label>Descripción de la Actividad</label>
                            <textarea class="form-control" id="community-description" rows="2"
                                      placeholder="Describe el propósito de esta actividad..."></textarea>
                        </div>
    
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Participantes por Comunidad *</label>
                                    <input type="number" class="form-control" id="community-participants-count" 
                                           min="2" max="${Math.max(2, Math.floor((course.participantes ? course.participantes.filter(p => p.estado === 'activo').length : 0) / 2))}" 
                                           value="5" required>
                                    <small class="form-text text-muted">
                                        Número de participantes por cada comunidad temporal
                                    </small>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Número de Comunidades</label>
                                    <div class="form-control-plaintext" id="communities-count-display">
                                        <div class="text-center">
                                            <div class="spinner-border spinner-border-sm" role="status">
                                                <span class="sr-only">Calculando...</span>
                                            </div>
                                            Calculando...
                                        </div>
                                    </div>
                                    <small class="form-text text-muted">
                                        Se crearán automáticamente según participantes disponibles
                                    </small>
                                </div>
                            </div>
                        </div>
    
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Prefijo para Nombres de Comunidades</label>
                                    <input type="text" class="form-control" id="community-prefix" 
                                           placeholder="Ej: Grupo, Equipo, Proyecto..." value="Grupo">
                                    <small class="form-text text-muted">
                                        Se usarán nombres como: "Grupo 1", "Grupo 2", etc.
                                    </small>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Resumen de Distribución</label>
                                    <div id="distribution-summary" class="alert alert-info p-2">
                                        <small>
                                            <i class="fas fa-info-circle"></i>
                                            La distribución se calculará automáticamente
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
    
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <strong>Importante:</strong> El sistema distribuirá automáticamente los participantes disponibles 
                            para la fecha seleccionada, asegurando que nadie quede en múltiples comunidades el mismo día.
                        </div>
    
                        <div class="form-group">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Crear Comunidades
                            </button>
                            <button type="button" class="btn btn-secondary" id="cancel-create-community">
                                <i class="fas fa-arrow-left"></i> Volver
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    
        // Configurar fecha mínima como hoy
        const today = new Date().toISOString().split('T')[0];
        $('#community-activity-date').attr('min', today);
    
        // Event listeners para cálculo en tiempo real
        $('#community-participants-count, #community-activity-date').on('input change', () => {
            this.actualizarCalculoComunidades(course);
        });
    
        $('#community-prefix').on('input', () => {
            this.actualizarCalculoComunidades(course);
        });
    
        // Inicializar cálculo
        setTimeout(() => {
            this.actualizarCalculoComunidades(course);
        }, 100);
    
        $('#create-temporal-community-form').on('submit', (e) => {
            e.preventDefault();
            this.createTemporalCommunity(course);
        });
    
        $('#cancel-create-community').on('click', () => {
            this.showCommunitiesManager(course);
        });
    }
    
    static actualizarCalculoComunidades(course) {
        const participantesPorComunidad = parseInt($('#community-participants-count').val()) || 5;
        const fechaActividad = $('#community-activity-date').val();
        const prefijo = $('#community-prefix').val() || 'Grupo';
        
        if (!fechaActividad) {
            $('#communities-count-display').html(`
                <span class="text-muted">Ingresa una fecha primero</span>
            `);
            $('#distribution-summary').html(`
                <small>
                    <i class="fas fa-info-circle"></i>
                    Ingresa la fecha de la actividad para calcular la distribución
                </small>
            `);
            return;
        }
        
        try {
            const distribucion = this.calcularDistribucionComunidades(course, participantesPorComunidad, fechaActividad);
            
            // Actualizar display de número de comunidades
            $('#communities-count-display').html(`
                <div>
                    <strong class="text-success">${distribucion.numeroComunidades} comunidades</strong>
                    <br>
                    <small class="text-muted">
                        ${distribucion.totalParticipantes} participantes disponibles
                    </small>
                </div>
            `);
    
            // Actualizar resumen de distribución
            const comunidadesEjemplo = [];
            for (let i = 1; i <= Math.min(3, distribucion.numeroComunidades); i++) {
                comunidadesEjemplo.push(`${prefijo} ${i}`);
            }
            
            $('#distribution-summary').html(`
                <small>
                    <i class="fas fa-check-circle text-success"></i>
                    <strong>Distribución calculada:</strong><br>
                    • ${distribucion.numeroComunidades} comunidades de ${participantesPorComunidad} participantes<br>
                    • ${distribucion.totalParticipantes} participantes disponibles<br>
                    • Ejemplo: ${comunidadesEjemplo.join(', ')}${distribucion.numeroComunidades > 3 ? '...' : ''}
                </small>
            `);
            
        } catch (error) {
            $('#communities-count-display').html(`
                <div>
                    <strong class="text-danger">Error</strong>
                    <br>
                    <small class="text-danger">${error.message}</small>
                </div>
            `);
            
            $('#distribution-summary').html(`
                <small class="text-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Error:</strong> ${error.message}
                </small>
            `);
        }
    }
    
    static calcularDistribucionComunidades(course, participantesPorComunidad, fechaActividad) {
        const participantesActivos = course.participantes.filter(p => p.estado === 'activo');
        
        if (participantesActivos.length === 0) {
            throw new Error('No hay participantes activos en el curso');
        }
        
        // Filtrar participantes que YA están en comunidades de la misma fecha
        const participantesOcupados = new Set();
        if (course.comunidadesTemporales) {
            course.comunidadesTemporales.forEach(comunidad => {
                if (comunidad.fechaActividad === fechaActividad && comunidad.participantes) {
                    comunidad.participantes.forEach(participantId => {
                        participantesOcupados.add(participantId);
                    });
                }
            });
        }
        
        // Participantes disponibles (no ocupados en misma fecha)
        const participantesDisponibles = participantesActivos.filter(p => 
            !participantesOcupados.has(p.id)
        );
        
        if (participantesDisponibles.length === 0) {
            throw new Error('No hay participantes disponibles para la fecha seleccionada. Todos ya están asignados en otras comunidades de esta fecha.');
        }
        
        if (participantesDisponibles.length < participantesPorComunidad) {
            throw new Error(`No hay suficientes participantes disponibles. Necesitas ${participantesPorComunidad} pero solo hay ${participantesDisponibles.length} disponibles para esta fecha.`);
        }
        
        // Calcular número de comunidades necesarias
        const numeroComunidades = Math.ceil(participantesDisponibles.length / participantesPorComunidad);
        
        return {
            participantesDisponibles,
            numeroComunidades,
            participantesPorComunidad,
            totalParticipantes: participantesDisponibles.length
        };
    }

    static createTemporalCommunity(course) {
        const communityData = {
            nombre: $('#community-name').val(),
            descripcion: $('#community-description').val(),
            fechaActividad: $('#community-activity-date').val(),
            participantesPorComunidad: parseInt($('#community-participants-count').val()),
            prefijo: $('#community-prefix').val() || 'Grupo'
        };
    
        // Validaciones
        if (!communityData.nombre.trim()) {
            alert('El nombre de la actividad es obligatorio');
            return;
        }
    
        if (!communityData.fechaActividad) {
            alert('La fecha de actividad es obligatoria');
            return;
        }
    
        if (!communityData.participantesPorComunidad || communityData.participantesPorComunidad < 2) {
            alert('Debe haber al menos 2 participantes por comunidad');
            return;
        }
    
        try {
            // Crear comunidades automáticamente
            const nuevasComunidades = this.crearComunidadesAutomaticas(course, communityData);
            
            if (nuevasComunidades.length === 0) {
                alert('No se pudieron crear comunidades. No hay participantes disponibles.');
                return;
            }
    
            // Agregar al curso
            if (!course.comunidadesTemporales) {
                course.comunidadesTemporales = [];
            }
            
            course.comunidadesTemporales.push(...nuevasComunidades);
            app.saveCourses();
            
            app.showNotification(
                `Se crearon ${nuevasComunidades.length} comunidades temporales con ${nuevasComunidades.reduce((total, com) => total + com.participantes.length, 0)} participantes`, 
                'success'
            );
            
            this.showCommunitiesManager(course);
            
        } catch (error) {
            alert(error.message);
        }
    }

    static asignarAleatorio(course, cantidad) {
        const participantesActivos = course.participantes.filter(p => p.estado === 'activo');
        const shuffled = [...participantesActivos].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, cantidad).map(p => p.id);
    }

    static asignarPorComunidad(course, cantidad) {
        const participantesActivos = course.participantes.filter(p => p.estado === 'activo');
        const participantesPorComunidad = {};

        // Agrupar por comunidad principal
        course.comunidadesPrincipales.forEach(comunidad => {
            participantesPorComunidad[comunidad.id] = participantesActivos.filter(p =>
                p.comunidadActual === comunidad.id
            );
        });

        // Seleccionar proporcionalmente
        const seleccionados = [];
        const totalParticipantes = participantesActivos.length;

        course.comunidadesPrincipales.forEach(comunidad => {
            const participantesComunidad = participantesPorComunidad[comunidad.id];
            const proporcion = participantesComunidad.length / totalParticipantes;
            const cantidadComunidad = Math.max(1, Math.round(cantidad * proporcion));

            const shuffled = [...participantesComunidad].sort(() => 0.5 - Math.random());
            seleccionados.push(...shuffled.slice(0, cantidadComunidad).map(p => p.id));
        });

        // Ajustar si hay más o menos de lo requerido
        return seleccionados.slice(0, cantidad);
    }

    static asignarManual() {
        const seleccionados = [];
        $('.participant-checkbox:checked').each(function () {
            seleccionados.push($(this).val());
        });
        return seleccionados;
    }

    static showManageParticipants(course, communityId) {
        const comunidad = course.comunidadesTemporales.find(c => c.id === communityId);
        if (!comunidad) return;

        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-user-edit"></i> Gestionar Participantes: ${comunidad.nombre}
                    </h3>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        Participantes actuales en esta comunidad temporal.
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <h5>Participantes Actuales</h5>
                            <div id="current-participants-list" class="border rounded p-3" style="max-height: 300px; overflow-y: auto;">
                                ${comunidad.participantes && comunidad.participantes.length > 0 ?
                comunidad.participantes.map(participantId => {
                    const participant = course.participantes.find(p => p.id === participantId);
                    return participant ? `
                                            <div class="participant-item mb-2 p-2 border rounded d-flex justify-content-between align-items-center">
                                                <div>
                                                    <strong>${participant.nombre}</strong>
                                                    ${participant.id ? `<br><small class="text-muted">${participant.id}</small>` : ''}
                                                    <br><small class="text-muted">${participant.comunidadActual}</small>
                                                </div>
                                                <button class="btn btn-sm btn-outline-danger remove-participant" 
                                                        data-participant-id="${participant.id}">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                        ` : '';
                }).join('') :
                '<p class="text-muted text-center">No hay participantes</p>'
            }
                            </div>
                        </div>

                        <div class="col-md-6">
                            <h5>Agregar Participantes</h5>
                            <div class="mb-3">
                                <input type="text" class="form-control" id="search-available-participants" 
                                       placeholder="Buscar participantes...">
                            </div>
                            <div id="available-participants-list" class="border rounded p-3" style="max-height: 250px; overflow-y: auto;">
                                ${this.renderAvailableParticipants(course, comunidad)}
                            </div>
                        </div>
                    </div>

                    <div class="row mt-4">
                        <div class="col-12 text-center">
                            <button class="btn btn-primary" id="save-participants-changes">
                                <i class="fas fa-save"></i> Guardar Cambios
                            </button>
                            <button class="btn btn-secondary" id="cancel-participants-changes">
                                <i class="fas fa-arrow-left"></i> Volver
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.bindManageParticipantsEvents(course, comunidad);
    }

    static renderAvailableParticipants(course, comunidad) {
        const participantesActivos = course.participantes.filter(p => p.estado === 'activo');
        const participantesDisponibles = participantesActivos.filter(p =>
            !comunidad.participantes.includes(p.id)
        );

        if (participantesDisponibles.length === 0) {
            return '<p class="text-muted text-center">No hay participantes disponibles</p>';
        }

        return participantesDisponibles.map(participant => `
            <div class="participant-available mb-2 p-2 border rounded d-flex justify-content-between align-items-center">
                <div>
                    <strong>${participant.nombre}</strong>
                    ${participant.id ? `<br><small class="text-muted">${participant.id}</small>` : ''}
                    <br><small class="text-muted">${participant.comunidadActual}</small>
                </div>
                <button class="btn btn-sm btn-outline-success add-participant" 
                        data-participant-id="${participant.id}">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `).join('');
    }

    static bindManageParticipantsEvents(course, comunidad) {
        // Buscar participantes
        $('#search-available-participants').on('input', function () {
            const searchTerm = $(this).val().toLowerCase();
            $('.participant-available').each(function () {
                const participantText = $(this).text().toLowerCase();
                $(this).toggle(participantText.includes(searchTerm));
            });
        });

        // Agregar participante
        $('.add-participant').on('click', function () {
            const participantId = $(this).data('participant-id');
            CommunitiesManager.addParticipantToCommunity(course, comunidad, participantId);
        });

        // Remover participante
        $('.remove-participant').on('click', function () {
            const participantId = $(this).data('participant-id');
            CommunitiesManager.removeParticipantFromCommunity(course, comunidad, participantId);
        });

        // Guardar cambios
        $('#save-participants-changes').on('click', () => {
            app.saveCourses();
            app.showNotification('Cambios guardados correctamente', 'success');
            this.showCommunitiesManager(course);
        });

        // Cancelar
        $('#cancel-participants-changes').on('click', () => {
            this.showCommunitiesManager(course);
        });
    }

    // EN EL MÉTODO addParticipantToCommunity, AGREGAR validación:

static addParticipantToCommunity(course, comunidad, participantId) {
    // Verificar que el participante no esté en otra comunidad de la misma fecha
    const comunidadesMismaFecha = course.comunidadesTemporales.filter(com => 
        com.fechaActividad === comunidad.fechaActividad && com.id !== comunidad.id
    );
    
    const yaEstaEnOtra = comunidadesMismaFecha.some(com => 
        com.participantes.includes(participantId)
    );
    
    if (yaEstaEnOtra) {
        alert('Este participante ya está asignado a otra comunidad en la misma fecha');
        return;
    }
    
    if (!comunidad.participantes.includes(participantId)) {
        comunidad.participantes.push(participantId);
        this.showManageParticipants(course, comunidad.id);
    }
}

    static removeParticipantFromCommunity(course, comunidad, participantId) {
        comunidad.participantes = comunidad.participantes.filter(id => id !== participantId);
        this.showManageParticipants(course, comunidad.id);
    }

    static showCommunityDetails(course, communityId) {
        const comunidad = course.comunidadesTemporales.find(c => c.id === communityId);
        if (!comunidad) return;

        const participantesDetalles = comunidad.participantes.map(participantId => {
            const participant = course.participantes.find(p => p.id === participantId);
            return participant ? participant : null;
        }).filter(p => p !== null);

        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-eye"></i> Detalles: ${comunidad.nombre}
                    </h3>
                </div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h5>Información de la Comunidad</h5>
                            <p><strong>Nombre:</strong> ${comunidad.nombre}</p>
                            <p><strong>Descripción:</strong> ${comunidad.descripcion || 'No especificada'}</p>
                            <p><strong>Fecha de creación:</strong> ${new Date(comunidad.fechaCreacion).toLocaleDateString()}</p>
                            ${comunidad.fechaActividad ? `
                                <p><strong>Fecha de actividad:</strong> ${new Date(comunidad.fechaActividad).toLocaleDateString()}</p>
                            ` : ''}
                            <p><strong>Participantes:</strong> ${participantesDetalles.length}</p>
                        </div>
                        <div class="col-md-6">
                            <h5>Distribución por Comunidades Principales</h5>
                            ${this.generarEstadisticasDistribucion(course, participantesDetalles)}
                        </div>
                    </div>

                    <h5>Lista de Participantes</h5>
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>ID</th>
                                    <th>Comunidad Principal</th>
                                    <th>Teléfono</th>
                                    <th>Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${participantesDetalles.map(participant => `
                                    <tr>
                                        <td>${participant.nombre}</td>
                                        <td>${participant.id || 'N/A'}</td>
                                        <td>${participant.comunidadActual || 'N/A'}</td>
                                        <td>${participant.telefono || 'N/A'}</td>
                                        <td>${participant.email || 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
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
            this.showCommunitiesManager(course);
        });
    }

    static generarEstadisticasDistribucion(course, participantes) {
        const distribucion = {};
        course.comunidadesPrincipales.forEach(comunidad => {
            distribucion[comunidad.nombre] = 0;
        });

        participantes.forEach(participant => {
            if (participant.comunidadActual) {
                const comunidad = course.comunidadesPrincipales.find(c => c.id === participant.comunidadActual);
                if (comunidad) {
                    distribucion[comunidad.nombre]++;
                }
            }
        });

        return Object.entries(distribucion).map(([nombre, count]) => `
            <p><strong>${nombre}:</strong> ${count} participantes</p>
        `).join('');
    }

    static deleteTemporalCommunity(course, communityId) {
        const comunidad = course.comunidadesTemporales.find(c => c.id === communityId);
        if (!comunidad) return;

        if (confirm(`¿Estás seguro de que quieres eliminar la comunidad "${comunidad.nombre}"?`)) {
            course.comunidadesTemporales = course.comunidadesTemporales.filter(c => c.id !== communityId);
            app.saveCourses();
            app.showNotification('Comunidad temporal eliminada', 'success');
            this.showCommunitiesManager(course);
        }
    }
}

// Hacer disponible globalmente
window.CommunitiesManager = CommunitiesManager;