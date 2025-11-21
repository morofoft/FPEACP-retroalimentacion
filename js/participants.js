// Gestión de participantes
class ParticipantsManager {
    static participants = [];

    static loadParticipants() {
        const saved = localStorage.getItem('dinamica-participants');
        if (saved) {
            this.participants = JSON.parse(saved);
        } else {
            this.participants = this.getDefaultParticipants();
            this.saveParticipants();
        }
        console.log('Participantes cargados:', this.participants.length);
        this.renderParticipantsTable();
    }

    static getDefaultParticipants() {
        const defaultNames = [
            "MARIEL COCA", "GENLY CONCEPCION", "YORCALIS CORDERO", "LEONARDO ENCARNACIÓN",
            "YAMALY FELIZ", "PEDRO GARCIA", "JOFFREY GONZALEZ", "DAYANARA LEREBOURS",
            "ELISANDRO LUCIANO", "YHAMNUARY MATEO", "LISSETTE MEDINA", "MARIA MIRANDA",
            "HENNY OGANDO", "LETICIA PANIAGUA", "KERVIN PIRON", "RICHARD RAMIREZ",
            "YONAIRY RAMOS", "LETICIA REYES", "LILIAN RODRIGUEZ", "WILSON TERRERO",
            "MAIKOL URIBE", "ORBIC VICIOSO", "ROSSY VILLEGAS"
        ];

        const principalCommunity = CommunitiesManager.getPrincipalCommunity();
        const principalId = principalCommunity ? principalCommunity.id : 'principal';
        
        return defaultNames.map((nombre, index) => ({
            id: 'part-' + index,
            nombre: nombre,
            comunidadPrincipal: principalId,
            comunidadesSecundarias: [],
            activo: true,
            vecesSeleccionado: 0,
            fechaRegistro: new Date().toISOString()
        }));
    }

    static saveParticipants() {
        localStorage.setItem('dinamica-participants', JSON.stringify(this.participants));
    }

    static getParticipants() {
        return this.participants;
    }

    static getParticipantsByCommunity(comunidadId, tipo = 'todos') {
        return this.participants.filter(p => {
            if (tipo === 'principal') {
                return p.comunidadPrincipal === comunidadId;
            } else if (tipo === 'secundaria') {
                return p.comunidadesSecundarias && p.comunidadesSecundarias.includes(comunidadId);
            } else {
                return p.comunidadPrincipal === comunidadId || 
                       (p.comunidadesSecundarias && p.comunidadesSecundarias.includes(comunidadId));
            }
        });
    }

    static getParticipant(id) {
        return this.participants.find(p => p.id === id);
    }

    static addParticipant(participantData) {
        const principalCommunity = CommunitiesManager.getPrincipalCommunity();
        const principalId = principalCommunity ? principalCommunity.id : 'principal';
        
        const newParticipant = {
            id: 'part-' + Date.now(),
            comunidadPrincipal: principalId,
            comunidadesSecundarias: [],
            ...participantData,
            vecesSeleccionado: 0,
            fechaRegistro: new Date().toISOString(),
            activo: true
        };
        
        this.participants.push(newParticipant);
        this.saveParticipants();
        this.renderParticipantsTable();
        
        if (window.wheelManager) {
            window.wheelManager.updateWheel();
        }
        
        return newParticipant;
    }

    static updateParticipant(id, updates) {
        const index = this.participants.findIndex(p => p.id === id);
        if (index !== -1) {
            this.participants[index] = { ...this.participants[index], ...updates };
            this.saveParticipants();
            this.renderParticipantsTable();
            
            if (window.wheelManager) {
                window.wheelManager.updateWheel();
            }
        }
    }

    static deleteParticipant(id) {
        this.participants = this.participants.filter(p => p.id !== id);
        this.saveParticipants();
        this.renderParticipantsTable();
        
        if (window.wheelManager) {
            window.wheelManager.updateWheel();
        }
    }

    static incrementSelectionCount(participantName) {
        const participant = this.participants.find(p => p.nombre === participantName);
        if (participant) {
            participant.vecesSeleccionado = (participant.vecesSeleccionado || 0) + 1;
            this.saveParticipants();
            this.renderParticipantsTable();
        }
    }

    static renderParticipantsTable() {
        const tbody = $('#participants-table tbody');
        console.log('Renderizando tabla de participantes...');
        
        if (this.participants.length === 0) {
            tbody.html('<tr><td colspan="6" class="text-center text-muted">No hay participantes registrados</td></tr>');
            return;
        }

        tbody.empty();

        this.participants.forEach(participant => {
            console.log('Procesando participante:', participant);
            
            const comunidadPrincipal = CommunitiesManager.getCommunity(participant.comunidadPrincipal);
            const comunidadesSecundarias = (participant.comunidadesSecundarias || [])
                .map(comId => CommunitiesManager.getCommunity(comId))
                .filter(com => com !== undefined);

            // Verificar que la comunidad principal existe
            if (!comunidadPrincipal) {
                console.warn(`Comunidad principal no encontrada para participante: ${participant.nombre}`);
                return;
            }

            const comunidadesSecundariasHTML = comunidadesSecundarias.length > 0 
                ? comunidadesSecundarias.map(com => `
                    <span class="badge badge-secondary mr-1 mb-1" style="background-color: ${com.color}">
                        ${com.nombre}
                    </span>
                `).join('')
                : '<span class="text-muted">Sin comunidades secundarias</span>';

            const row = $(`
                <tr>
                    <td>
                        <strong>${participant.nombre}</strong>
                    </td>
                    <td>
                        <span class="badge badge-primary" style="background-color: ${comunidadPrincipal.color}">
                            ${comunidadPrincipal.nombre}
                        </span>
                    </td>
                    <td>
                        ${comunidadesSecundariasHTML}
                    </td>
                    <td>
                        <span class="badge ${participant.activo ? 'badge-success' : 'badge-secondary'}">
                            ${participant.activo ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td>
                        <span class="badge badge-info">${participant.vecesSeleccionado || 0}</span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary edit-participant" data-id="${participant.id}" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-info manage-communities" data-id="${participant.id}" title="Gestionar Comunidades">
                                <i class="fas fa-layer-group"></i>
                            </button>
                            <button class="btn btn-outline-danger delete-participant" data-id="${participant.id}" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                            <button class="btn btn-outline-secondary toggle-participant" data-id="${participant.id}" title="${participant.activo ? 'Desactivar' : 'Activar'}">
                                <i class="fas ${participant.activo ? 'fa-eye-slash' : 'fa-eye'}"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);
            
            tbody.append(row);
        });

        console.log('Tabla renderizada con', this.participants.length, 'participantes');
        this.bindParticipantEvents();
    }

    static bindParticipantEvents() {
        // Limpiar eventos anteriores
        $('.edit-participant').off('click');
        $('.manage-communities').off('click');
        $('.delete-participant').off('click');
        $('.toggle-participant').off('click');

        $('.edit-participant').on('click', function() {
            const participantId = $(this).data('id');
            ParticipantsManager.editParticipant(participantId);
        });

        $('.manage-communities').on('click', function() {
            const participantId = $(this).data('id');
            ParticipantsManager.manageParticipantCommunities(participantId);
        });

        $('.delete-participant').on('click', function() {
            const participantId = $(this).data('id');
            if (confirm('¿Estás seguro de que quieres eliminar este participante?')) {
                ParticipantsManager.deleteParticipant(participantId);
            }
        });

        $('.toggle-participant').on('click', function() {
            const participantId = $(this).data('id');
            ParticipantsManager.toggleParticipantStatus(participantId);
        });
    }

    static editParticipant(id) {
        const participant = this.getParticipant(id);
        if (!participant) {
            alert('Participante no encontrado');
            return;
        }

        const newNombre = prompt('Nuevo nombre del participante:', participant.nombre);
        if (newNombre && newNombre.trim() !== '' && newNombre !== participant.nombre) {
            this.updateParticipant(id, { nombre: newNombre.trim() });
            alert('Nombre actualizado correctamente');
        }
    }

    static manageParticipantCommunities(id) {
        const participant = this.getParticipant(id);
        if (!participant) {
            alert('Participante no encontrado');
            return;
        }

        const secondaryCommunities = CommunitiesManager.getSecondaryCommunities();
        
        if (secondaryCommunities.length === 0) {
            alert('No hay comunidades secundarias disponibles. Primero crea algunas comunidades secundarias.');
            return;
        }

        let message = `Gestionar comunidades para: ${participant.nombre}\n\n`;
        
        const comunidadPrincipal = CommunitiesManager.getCommunity(participant.comunidadPrincipal);
        message += `📍 Comunidad Principal: ${comunidadPrincipal ? comunidadPrincipal.nombre : 'No definida'}\n\n`;
        
        message += '🏷️ Comunidades Secundarias (selecciona números):\n';
        
        secondaryCommunities.forEach((comunidad, index) => {
            const isMember = participant.comunidadesSecundarias && participant.comunidadesSecundarias.includes(comunidad.id);
            message += `${index + 1}. [${isMember ? '✓' : ' '}] ${comunidad.nombre}\n`;
        });

        const userInput = prompt(message + '\n📝 Escribe los números de las comunidades a las que quieres que pertenezca (separados por coma, ej: 1,3):');
        
        if (userInput !== null) {
            const selectedNumbers = userInput.split(',')
                .map(num => parseInt(num.trim()))
                .filter(num => !isNaN(num) && num >= 1 && num <= secondaryCommunities.length);
            
            const nuevasSecundarias = selectedNumbers.map(num => {
                const index = num - 1;
                return secondaryCommunities[index] ? secondaryCommunities[index].id : null;
            }).filter(id => id !== null);

            this.updateParticipant(id, { comunidadesSecundarias: nuevasSecundarias });
            alert('Comunidades actualizadas correctamente');
        }
    }

    static toggleParticipantStatus(id) {
        const participant = this.getParticipant(id);
        if (participant) {
            const nuevoEstado = !participant.activo;
            this.updateParticipant(id, { activo: nuevoEstado });
            alert(`Participante ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
        }
    }

    static showAddParticipantModal() {
        const nombre = prompt('Nombre del nuevo participante:');
        if (nombre && nombre.trim() !== '') {
            this.addParticipant({
                nombre: nombre.trim()
            });
            alert('Participante agregado correctamente');
        } else if (nombre !== null) {
            alert('El nombre no puede estar vacío');
        }
    }

    static getParticipantsForWheel(comunidadId = null) {
        let participantes = this.participants.filter(p => p.activo);

        if (comunidadId && comunidadId !== '') {
            if (comunidadId === 'principal') {
                // Todos los participantes activos están en la comunidad principal
                // No necesitamos filtrar ya que todos pertenecen a la principal
            } else {
                // Filtrar por comunidad secundaria específica
                participantes = participantes.filter(p => 
                    p.comunidadesSecundarias && p.comunidadesSecundarias.includes(comunidadId)
                );
            }
        }

        return participantes.map(p => p.nombre);
    }

    // Método para debug
    static debugParticipants() {
        console.log('=== DEBUG PARTICIPANTES ===');
        console.log('Total participantes:', this.participants.length);
        this.participants.forEach((p, i) => {
            console.log(`${i + 1}. ${p.nombre} - Principal: ${p.comunidadPrincipal} - Secundarias:`, p.comunidadesSecundarias);
        });
    }
}

// Inicializar participantes
$(document).ready(() => {
    console.log('Inicializando gestor de participantes...');
    
    // Esperar a que las comunidades se carguen primero
    const initParticipants = () => {
        if (typeof CommunitiesManager !== 'undefined' && CommunitiesManager.getCommunities().length > 0) {
            ParticipantsManager.loadParticipants();
            
            // Botón para agregar participante
            $('#add-participant-btn').off('click').on('click', () => {
                ParticipantsManager.showAddParticipantModal();
            });

            // Debug button (puedes remover esto después)
            $('#add-participant-btn').after('<button id="debug-btn" class="btn btn-warning btn-sm ml-2"><i class="fas fa-bug"></i> Debug</button>');
            $('#debug-btn').on('click', () => {
                ParticipantsManager.debugParticipants();
            });
            
            console.log('Gestor de participantes inicializado correctamente');
        } else {
            console.log('Esperando comunidades...');
            setTimeout(initParticipants, 100);
        }
    };

    initParticipants();
});