// Gestión de Participantes por Curso
class ParticipantsManager {
    static showParticipantsManager(course) {
        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-users"></i> Gestión de Participantes
                        <span class="badge badge-primary ml-2">${course.participantes ? course.participantes.length : 0} participantes</span>
                    </h3>
                    <div class="card-tools">
                        <button class="btn btn-success btn-sm" id="add-participant-btn">
                            <i class="fas fa-user-plus"></i> Agregar Participante
                        </button>
                        <button class="btn btn-info btn-sm" id="import-participants-btn">
                            <i class="fas fa-file-import"></i> Importar Lista
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="search-participants" 
                                   placeholder="Buscar por nombre o ID...">
                        </div>
                        <div class="col-md-3">
                            <select class="form-control" id="filter-community">
                                <option value="">Todas las comunidades</option>
                                <option value="feedback">Feedback</option>
                                <option value="dinamica">Dinámica</option>
                                <option value="orden">Orden y Limpieza</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-control" id="filter-status">
                                <option value="">Todos los estados</option>
                                <option value="activo">Activo</option>
                                <option value="inactivo">Inactivo</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="table-responsive">
                        <table class="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>ID</th>
                                    <th>Teléfono</th>
                                    <th>Email</th>
                                    <th>Comunidades</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="participants-table-body">
                                <!-- Los participantes se cargarán aquí -->
                            </tbody>
                        </table>
                    </div>
                    
                    ${(!course.participantes || course.participantes.length === 0) ? `
                    <div class="text-center py-4">
                        <i class="fas fa-users fa-3x text-muted mb-3"></i>
                        <h4>No hay participantes registrados</h4>
                        <p class="text-muted">Comienza agregando participantes al curso</p>
                        <button class="btn btn-primary" id="add-first-participant">
                            <i class="fas fa-user-plus"></i> Agregar Primer Participante
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
        `);

        this.renderParticipantsTable(course);
        this.bindParticipantsEvents(course);
    }

    static renderParticipantsTable(course) {
        const tbody = $('#participants-table-body');
        tbody.empty();

        if (!course.participantes || course.participantes.length === 0) {
            return;
        }

        // Aplicar filtros
        let filteredParticipants = [...course.participantes];
        
        // Filtro de búsqueda
        const searchTerm = $('#search-participants').val().toLowerCase();
        if (searchTerm) {
            filteredParticipants = filteredParticipants.filter(p => 
                p.nombre.toLowerCase().includes(searchTerm) || 
                (p.id && p.id.toLowerCase().includes(searchTerm))
            );
        }

        // Filtro por comunidad
        const communityFilter = $('#filter-community').val();
        if (communityFilter) {
            filteredParticipants = filteredParticipants.filter(p => 
                p.comunidadActual === communityFilter
            );
        }

        // Filtro por estado
        const statusFilter = $('#filter-status').val();
        if (statusFilter) {
            filteredParticipants = filteredParticipants.filter(p => 
                p.estado === statusFilter
            );
        }

        filteredParticipants.forEach(participant => {
            const comunidadesHTML = this.getCommunitiesHTML(participant, course);
            
            const row = $(`
                <tr>
                    <td>
                        <strong>${participant.nombre}</strong>
                        ${participant.observaciones ? `<br><small class="text-muted">${participant.observaciones}</small>` : ''}
                    </td>
                    <td>${participant.id || 'N/A'}</td>
                    <td>${participant.telefono || 'N/A'}</td>
                    <td>${participant.email || 'N/A'}</td>
                    <td>${comunidadesHTML}</td>
                    <td>
                        <span class="badge badge-${participant.estado === 'activo' ? 'success' : 'secondary'}">
                            ${participant.estado}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary edit-participant" 
                                    data-participant-id="${participant.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-info view-history" 
                                    data-participant-id="${participant.id}">
                                <i class="fas fa-history"></i>
                            </button>
                            <button class="btn btn-outline-danger delete-participant" 
                                    data-participant-id="${participant.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
            
            tbody.append(row);
        });

        // Actualizar contador
        const counter = $('#participants-table-body tr').length;
        $('.card-title .badge').text(`${counter} participantes`);
    }

    static getCommunitiesHTML(participant, course) {
        const comunidadActual = participant.comunidadActual;
        let html = '';
        
        if (comunidadActual) {
            const comunidad = course.comunidadesPrincipales.find(c => c.id === comunidadActual);
            if (comunidad) {
                html += `<span class="badge" style="background-color: ${comunidad.color}">${comunidad.nombre}</span>`;
            }
        }

        // Comunidades temporales activas
        if (participant.comunidadesTemporales && participant.comunidadesTemporales.length > 0) {
            participant.comunidadesTemporales.forEach(comTempId => {
                const comTemp = course.comunidadesTemporales.find(ct => ct.id === comTempId);
                if (comTemp) {
                    html += `<span class="badge badge-secondary ml-1">${comTemp.nombre}</span>`;
                }
            });
        }

        return html || '<span class="text-muted">Sin asignar</span>';
    }

    static bindParticipantsEvents(course) {
        // Agregar participante
        $('#add-participant-btn, #add-first-participant').off('click').on('click', () => {
            this.showAddParticipantForm(course);
        });

        // Búsqueda y filtros en tiempo real
        $('#search-participants, #filter-community, #filter-status').off('input change').on('input change', () => {
            this.renderParticipantsTable(course);
        });

        // Editar participante
        $('.edit-participant').off('click').on('click', function() {
            const participantId = $(this).data('participant-id');
            ParticipantsManager.showEditParticipantForm(course, participantId);
        });

        // Ver historial
        $('.view-history').off('click').on('click', function() {
            const participantId = $(this).data('participant-id');
            ParticipantsManager.showParticipantHistory(course, participantId);
        });

        // Eliminar participante
        $('.delete-participant').off('click').on('click', function() {
            const participantId = $(this).data('participant-id');
            ParticipantsManager.deleteParticipant(course, participantId);
        });

        // Importar lista
        $('#import-participants-btn').off('click').on('click', () => {
            this.showImportParticipantsForm(course);
        });
    }

    static showAddParticipantForm(course) {
        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-user-plus"></i> Agregar Nuevo Participante
                    </h3>
                </div>
                <div class="card-body">
                    <form id="add-participant-form">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Nombre Completo *</label>
                                    <input type="text" class="form-control" id="participant-name" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>ID/Cédula</label>
                                    <input type="text" class="form-control" id="participant-id">
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Teléfono</label>
                                    <input type="tel" class="form-control" id="participant-phone">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Email</label>
                                    <input type="email" class="form-control" id="participant-email">
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Comunidad Principal Inicial</label>
                            <select class="form-control" id="participant-community">
                                <option value="">Asignar automáticamente</option>
                                ${course.comunidadesPrincipales.map(com => 
                                    `<option value="${com.id}">${com.nombre}</option>`
                                ).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Observaciones</label>
                            <textarea class="form-control" id="participant-notes" rows="3" 
                                      placeholder="Notas adicionales sobre el participante..."></textarea>
                        </div>

                        <div class="form-group">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Guardar Participante
                            </button>
                            <button type="button" class="btn btn-secondary" id="cancel-add-participant">
                                <i class="fas fa-arrow-left"></i> Volver
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `);

        $('#add-participant-form').on('submit', (e) => {
            e.preventDefault();
            this.addParticipant(course);
        });

        $('#cancel-add-participant').on('click', () => {
            this.showParticipantsManager(course);
        });
    }

    static addParticipant(course) {
        const participantData = {
            id: $('#participant-id').val() || 'PART-' + Date.now(),
            nombre: $('#participant-name').val(),
            telefono: $('#participant-phone').val(),
            email: $('#participant-email').val(),
            observaciones: $('#participant-notes').val(),
            estado: 'activo',
            fechaRegistro: new Date().toISOString()
        };

        // Validación
        if (!participantData.nombre.trim()) {
            alert('El nombre es obligatorio');
            return;
        }

        // Asignar comunidad automáticamente si no se especificó
        if (!$('#participant-community').val()) {
            // Asignar a la comunidad con menos participantes
            const communityCounts = {};
            course.comunidadesPrincipales.forEach(com => {
                communityCounts[com.id] = course.participantes ? 
                    course.participantes.filter(p => p.comunidadActual === com.id).length : 0;
            });
            
            const minCommunity = Object.keys(communityCounts).reduce((a, b) => 
                communityCounts[a] < communityCounts[b] ? a : b
            );
            
            participantData.comunidadActual = minCommunity;
        } else {
            participantData.comunidadActual = $('#participant-community').val();
        }

        // Inicializar arrays
        participantData.comunidadesTemporales = [];
        participantData.historialComunidades = [{
            comunidad: participantData.comunidadActual,
            fechaAsignacion: new Date().toISOString(),
            tipo: 'inicial'
        }];

        // Agregar al curso
        if (!course.participantes) {
            course.participantes = [];
        }
        
        course.participantes.push(participantData);
        app.saveCourses();
        
        app.showNotification('Participante agregado exitosamente', 'success');
        this.showParticipantsManager(course);
    }

    static showEditParticipantForm(course, participantId) {
        const participant = course.participantes.find(p => p.id === participantId);
        if (!participant) return;

        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-edit"></i> Editar Participante: ${participant.nombre}
                    </h3>
                </div>
                <div class="card-body">
                    <form id="edit-participant-form">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Nombre Completo *</label>
                                    <input type="text" class="form-control" id="edit-participant-name" 
                                           value="${participant.nombre}" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>ID/Cédula</label>
                                    <input type="text" class="form-control" id="edit-participant-id" 
                                           value="${participant.id || ''}">
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Teléfono</label>
                                    <input type="tel" class="form-control" id="edit-participant-phone" 
                                           value="${participant.telefono || ''}">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Email</label>
                                    <input type="email" class="form-control" id="edit-participant-email" 
                                           value="${participant.email || ''}">
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Estado</label>
                            <select class="form-control" id="edit-participant-status">
                                <option value="activo" ${participant.estado === 'activo' ? 'selected' : ''}>Activo</option>
                                <option value="inactivo" ${participant.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Observaciones</label>
                            <textarea class="form-control" id="edit-participant-notes" rows="3">${participant.observaciones || ''}</textarea>
                        </div>

                        <div class="form-group">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Actualizar Participante
                            </button>
                            <button type="button" class="btn btn-secondary" id="cancel-edit-participant">
                                <i class="fas fa-arrow-left"></i> Volver
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `);

        $('#edit-participant-form').on('submit', (e) => {
            e.preventDefault();
            this.updateParticipant(course, participantId);
        });

        $('#cancel-edit-participant').on('click', () => {
            this.showParticipantsManager(course);
        });
    }

    static updateParticipant(course, participantId) {
        const participantIndex = course.participantes.findIndex(p => p.id === participantId);
        if (participantIndex === -1) return;

        const updates = {
            nombre: $('#edit-participant-name').val(),
            id: $('#edit-participant-id').val(),
            telefono: $('#edit-participant-phone').val(),
            email: $('#edit-participant-email').val(),
            estado: $('#edit-participant-status').val(),
            observaciones: $('#edit-participant-notes').val()
        };

        // Validación
        if (!updates.nombre.trim()) {
            alert('El nombre es obligatorio');
            return;
        }

        course.participantes[participantIndex] = {
            ...course.participantes[participantIndex],
            ...updates
        };

        app.saveCourses();
        app.showNotification('Participante actualizado exitosamente', 'success');
        this.showParticipantsManager(course);
    }

    static deleteParticipant(course, participantId) {
        const participant = course.participantes.find(p => p.id === participantId);
        if (!participant) return;

        if (confirm(`¿Estás seguro de que quieres eliminar a ${participant.nombre}?`)) {
            course.participantes = course.participantes.filter(p => p.id !== participantId);
            app.saveCourses();
            app.showNotification('Participante eliminado exitosamente', 'success');
            this.showParticipantsManager(course);
        }
    }

    static showImportParticipantsForm(course) {
        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-file-import"></i> Importar Lista de Participantes
                    </h3>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <h5><i class="fas fa-info-circle"></i> Formato de Importación</h5>
                        <p>Puedes pegar una lista de nombres, uno por línea. Opcionalmente incluir ID, teléfono y email separados por comas.</p>
                        <p><strong>Formato:</strong> Nombre Apellido, ID, Teléfono, Email</p>
                        <p><strong>Ejemplo:</strong><br>
                        Juan Pérez, 001-1234567-8, 809-555-1234, juan@email.com<br>
                        María García, 002-7654321-0, 809-555-5678, maria@email.com</p>
                    </div>

                    <form id="import-participants-form">
                        <div class="form-group">
                            <label>Lista de Participantes</label>
                            <textarea class="form-control" id="participants-list" rows="10" 
                                      placeholder="Pega aquí la lista de participantes..."></textarea>
                        </div>

                        <div class="form-group">
                            <label>Asignar a Comunidad</label>
                            <select class="form-control" id="import-community">
                                <option value="">Distribuir automáticamente</option>
                                ${course.comunidadesPrincipales.map(com => 
                                    `<option value="${com.id}">${com.nombre}</option>`
                                ).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-upload"></i> Importar Participantes
                            </button>
                            <button type="button" class="btn btn-secondary" id="cancel-import">
                                <i class="fas fa-arrow-left"></i> Volver
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `);

        $('#import-participants-form').on('submit', (e) => {
            e.preventDefault();
            this.importParticipants(course);
        });

        $('#cancel-import').on('click', () => {
            this.showParticipantsManager(course);
        });
    }

    static importParticipants(course) {
        const participantsText = $('#participants-list').val();
        if (!participantsText.trim()) {
            alert('Por favor ingresa la lista de participantes');
            return;
        }

        const lines = participantsText.split('\n').filter(line => line.trim());
        const newParticipants = [];
        const targetCommunity = $('#import-community').val();

        // Calcular distribución automática si no hay comunidad específica
        const communityCounts = {};
        if (!targetCommunity) {
            course.comunidadesPrincipales.forEach(com => {
                communityCounts[com.id] = course.participantes ? 
                    course.participantes.filter(p => p.comunidadActual === com.id).length : 0;
            });
        }

        lines.forEach((line, index) => {
            const parts = line.split(',').map(part => part.trim());
            const nombre = parts[0];
            
            if (!nombre) return;

            let comunidadAsignada;
            if (targetCommunity) {
                comunidadAsignada = targetCommunity;
            } else {
                // Asignar a la comunidad con menos participantes
                const minCommunity = Object.keys(communityCounts).reduce((a, b) => 
                    communityCounts[a] < communityCounts[b] ? a : b
                );
                comunidadAsignada = minCommunity;
                communityCounts[minCommunity]++;
            }

            const participant = {
                id: parts[1] || 'IMP-' + Date.now() + '-' + index,
                nombre: nombre,
                telefono: parts[2] || '',
                email: parts[3] || '',
                estado: 'activo',
                comunidadActual: comunidadAsignada,
                fechaRegistro: new Date().toISOString(),
                comunidadesTemporales: [],
                historialComunidades: [{
                    comunidad: comunidadAsignada,
                    fechaAsignacion: new Date().toISOString(),
                    tipo: 'importacion'
                }]
            };

            newParticipants.push(participant);
        });

        // Agregar al curso
        if (!course.participantes) {
            course.participantes = [];
        }
        
        course.participantes.push(...newParticipants);
        app.saveCourses();
        
        app.showNotification(`${newParticipants.length} participantes importados exitosamente`, 'success');
        this.showParticipantsManager(course);
    }

    static showParticipantHistory(course, participantId) {
        const participant = course.participantes.find(p => p.id === participantId);
        if (!participant) return;

        const historialHTML = participant.historialComunidades ? 
            participant.historialComunidades.map(hist => `
                <tr>
                    <td>${hist.comunidad}</td>
                    <td>${new Date(hist.fechaAsignacion).toLocaleDateString()}</td>
                    <td>${hist.tipo}</td>
                </tr>
            `).join('') : '<tr><td colspan="3" class="text-center">No hay historial</td></tr>';

        $('#course-modules-content').html(`
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-history"></i> Historial de ${participant.nombre}
                    </h3>
                </div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <p><strong>ID:</strong> ${participant.id || 'N/A'}</p>
                            <p><strong>Comunidad Actual:</strong> ${participant.comunidadActual || 'No asignada'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Teléfono:</strong> ${participant.telefono || 'N/A'}</p>
                            <p><strong>Email:</strong> ${participant.email || 'N/A'}</p>
                        </div>
                    </div>

                    <h5>Historial de Comunidades</h5>
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Comunidad</th>
                                    <th>Fecha</th>
                                    <th>Tipo</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${historialHTML}
                            </tbody>
                        </table>
                    </div>

                    <div class="mt-3">
                        <button class="btn btn-secondary" id="back-from-history">
                            <i class="fas fa-arrow-left"></i> Volver
                        </button>
                    </div>
                </div>
            </div>
        `);

        $('#back-from-history').on('click', () => {
            this.showParticipantsManager(course);
        });
    }
}

// Integrar con la aplicación principal
window.ParticipantsManager = ParticipantsManager;
