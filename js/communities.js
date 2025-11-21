// Gestión de comunidades
class CommunitiesManager {
    static communities = [];

    static loadCommunities() {
        const saved = localStorage.getItem('dinamica-communities');
        this.communities = saved ? JSON.parse(saved) : this.getDefaultCommunities();
        this.renderCommunities();
        this.updateComunidadSelect();
        this.updateParticipantCommunitySelects();
    }

    static getDefaultCommunities() {
        return [
            {
                id: 'principal',
                nombre: 'Comunidad Principal',
                descripcion: 'Comunidad principal de participantes',
                color: '#1a2a6c',
                tipo: 'principal',
                fechaCreacion: new Date().toISOString()
            },
            {
                id: 'secundaria-1',
                nombre: 'Grupo Avanzado',
                descripcion: 'Grupo para estudiantes avanzados',
                color: '#28a745',
                tipo: 'secundaria',
                fechaCreacion: new Date().toISOString()
            },
            {
                id: 'secundaria-2',
                nombre: 'Grupo Refuerzo',
                descripcion: 'Grupo para refuerzo de conceptos',
                color: '#fd7e14',
                tipo: 'secundaria',
                fechaCreacion: new Date().toISOString()
            }
        ];
    }

    static saveCommunities() {
        localStorage.setItem('dinamica-communities', JSON.stringify(this.communities));
    }

    static getCommunities() {
        return this.communities;
    }

    static getCommunity(id) {
        return this.communities.find(c => c.id === id);
    }

    static getPrincipalCommunity() {
        return this.communities.find(c => c.tipo === 'principal');
    }

    static getSecondaryCommunities() {
        return this.communities.filter(c => c.tipo === 'secundaria');
    }

    static addCommunity(comunidad) {
        const newCommunity = {
            id: 'com-' + Date.now(),
            tipo: 'secundaria',
            ...comunidad,
            fechaCreacion: new Date().toISOString()
        };
        
        this.communities.push(newCommunity);
        this.saveCommunities();
        this.renderCommunities();
        this.updateComunidadSelect();
        this.updateParticipantCommunitySelects();
        return newCommunity;
    }

    static updateCommunity(id, updates) {
        const index = this.communities.findIndex(c => c.id === id);
        if (index !== -1) {
            // No permitir cambiar el tipo de la comunidad principal
            if (this.communities[index].tipo === 'principal' && updates.tipo === 'secundaria') {
                alert('No se puede cambiar el tipo de la comunidad principal');
                return;
            }
            
            this.communities[index] = { ...this.communities[index], ...updates };
            this.saveCommunities();
            this.renderCommunities();
            this.updateComunidadSelect();
            this.updateParticipantCommunitySelects();
        }
    }

    static deleteCommunity(id) {
        const community = this.getCommunity(id);
        
        // No permitir eliminar la comunidad principal
        if (community.tipo === 'principal') {
            alert('No se puede eliminar la comunidad principal');
            return false;
        }

        // Verificar si hay participantes en esta comunidad
        const participantsInCommunity = ParticipantsManager.getParticipants().filter(p => 
            p.comunidadesSecundarias && p.comunidadesSecundarias.includes(id)
        );
        
        if (participantsInCommunity.length > 0) {
            if (!confirm(`Esta comunidad tiene ${participantsInCommunity.length} participantes. ¿Estás seguro de que quieres eliminarla? Los participantes serán removidos de esta comunidad.`)) {
                return false;
            }
            
            // Remover participantes de esta comunidad secundaria
            participantsInCommunity.forEach(participant => {
                const nuevasSecundarias = participant.comunidadesSecundarias.filter(comId => comId !== id);
                ParticipantsManager.updateParticipant(participant.id, { comunidadesSecundarias: nuevasSecundarias });
            });
        }
        
        this.communities = this.communities.filter(c => c.id !== id);
        this.saveCommunities();
        this.renderCommunities();
        this.updateComunidadSelect();
        this.updateParticipantCommunitySelects();
        return true;
    }

    static renderCommunities() {
        const container = $('#comunidades-list');
        container.empty();

        // Separar comunidades principales y secundarias
        const principalCommunity = this.getPrincipalCommunity();
        const secondaryCommunities = this.getSecondaryCommunities();

        // Comunidad Principal
        if (principalCommunity) {
            const participantCount = ParticipantsManager.getParticipantsByCommunity(principalCommunity.id, 'principal').length;
            
            const communityCard = $(`
                <div class="col-md-6">
                    <div class="card comunidad-card principal-community" style="border-left-color: ${principalCommunity.color}">
                        <div class="card-header" style="background-color: ${principalCommunity.color}20">
                            <h5 class="card-title mb-0 text-primary">
                                <i class="fas fa-star"></i> COMUNIDAD PRINCIPAL
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="card-title">
                                        <span class="comunidad-color" style="background-color: ${principalCommunity.color}"></span>
                                        ${principalCommunity.nombre}
                                    </h6>
                                    <p class="card-text text-muted small">${principalCommunity.descripcion || 'Comunidad principal de todos los participantes'}</p>
                                    <small class="text-muted">
                                        <i class="fas fa-users"></i> ${participantCount} participantes
                                    </small>
                                </div>
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-outline-primary edit-comunidad" data-id="${principalCommunity.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            
            container.append(communityCard);
        }

        // Comunidades Secundarias
        secondaryCommunities.forEach(comunidad => {
            const participantCount = ParticipantsManager.getParticipantsByCommunity(comunidad.id, 'secundaria').length;
            
            const communityCard = $(`
                <div class="col-md-6">
                    <div class="card comunidad-card secondary-community" style="border-left-color: ${comunidad.color}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="card-title">
                                        <span class="comunidad-color" style="background-color: ${comunidad.color}"></span>
                                        ${comunidad.nombre}
                                        <span class="badge badge-secondary badge-sm">Secundaria</span>
                                    </h6>
                                    <p class="card-text text-muted small">${comunidad.descripcion || 'Comunidad secundaria'}</p>
                                    <small class="text-muted">
                                        <i class="fas fa-users"></i> ${participantCount} participantes
                                    </small>
                                </div>
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-outline-primary edit-comunidad" data-id="${comunidad.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger delete-comunidad" data-id="${comunidad.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            
            container.append(communityCard);
        });

        // Botón para agregar nueva comunidad secundaria
        const addCard = $(`
            <div class="col-md-6">
                <div class="card comunidad-card add-community-card">
                    <div class="card-body text-center">
                        <button class="btn btn-outline-success btn-sm" id="add-secondary-community-btn">
                            <i class="fas fa-plus-circle"></i> Agregar Comunidad Secundaria
                        </button>
                    </div>
                </div>
            </div>
        `);
        
        container.append(addCard);

        this.bindCommunityEvents();
    }

    static updateComunidadSelect() {
        const select = $('#comunidad-select');
        select.empty();
        select.append('<option value="">Todas las comunidades</option>');
        select.append('<option value="principal">Comunidad Principal</option>');
        
        this.getSecondaryCommunities().forEach(comunidad => {
            select.append(`<option value="${comunidad.id}">${comunidad.nombre}</option>`);
        });
    }

    static updateParticipantCommunitySelects() {
        // Este método se usará para actualizar selects en formularios de participantes
        const secondaryCommunities = this.getSecondaryCommunities();
        
        // Actualizar cualquier select de comunidades secundarias en la UI
        $('.secundarias-select').each(function() {
            const currentValues = $(this).data('current') || [];
            $(this).empty();
            
            secondaryCommunities.forEach(comunidad => {
                const isSelected = currentValues.includes(comunidad.id);
                $(this).append(`
                    <option value="${comunidad.id}" ${isSelected ? 'selected' : ''}>
                        ${comunidad.nombre}
                    </option>
                `);
            });
        });
    }

    static bindCommunityEvents() {
        $('.edit-comunidad').on('click', function() {
            const communityId = $(this).data('id');
            CommunitiesManager.editCommunity(communityId);
        });

        $('.delete-comunidad').on('click', function() {
            const communityId = $(this).data('id');
            CommunitiesManager.deleteCommunity(communityId);
        });

        $('#add-secondary-community-btn').on('click', function() {
            CommunitiesManager.showAddCommunityModal();
        });
    }

    static showAddCommunityModal() {
        // Modal simple para agregar comunidad
        const nombre = prompt('Nombre de la nueva comunidad secundaria:');
        if (nombre) {
            const descripcion = prompt('Descripción (opcional):');
            const color = prompt('Color en hexadecimal (ej: #28a745):', '#28a745');
            
            this.addCommunity({
                nombre: nombre,
                descripcion: descripcion,
                color: color || '#28a745'
            });
        }
    }

    static editCommunity(id) {
        const community = this.getCommunity(id);
        if (!community) return;

        const newNombre = prompt('Nuevo nombre de la comunidad:', community.nombre);
        if (newNombre && newNombre !== community.nombre) {
            const newDescripcion = prompt('Nueva descripción:', community.descripcion || '');
            const newColor = prompt('Nuevo color:', community.color);
            
            this.updateCommunity(id, { 
                nombre: newNombre,
                descripcion: newDescripcion,
                color: newColor || community.color
            });
        }
    }

    // Método para obtener todas las comunidades de un participante
    static getParticipantCommunities(participant) {
        const principal = this.getPrincipalCommunity();
        const secundarias = participant.comunidadesSecundarias || [];
        
        const comunidades = [principal];
        secundarias.forEach(comId => {
            const com = this.getCommunity(comId);
            if (com) comunidades.push(com);
        });
        
        return comunidades;
    }

    // Método para verificar si un participante pertenece a una comunidad
    static isParticipantInCommunity(participant, communityId) {
        if (participant.comunidadPrincipal === communityId) return true;
        if (participant.comunidadesSecundarias && participant.comunidadesSecundarias.includes(communityId)) return true;
        return false;
    }
}

$(document).ready(() => {
    console.log('Inicializando gestor de comunidades...');
    CommunitiesManager.loadCommunities();
    console.log('Comunidades cargadas:', CommunitiesManager.getCommunities().length);
});