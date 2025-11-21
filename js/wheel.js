// Gestión de la rueda de selección
class WheelManager {
    constructor() {
        this.canvas = document.getElementById('wheel-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isSpinning = false;
        this.wheelRotation = 0;
        this.selectedParticipants = [];
        this.currentSelectionIndex = 0;
        this.init();
    }

    init() {
        this.bindEvents();
        this.drawWheel();
    }

    bindEvents() {
        $('#start-btn').off('click').on('click', () => this.startSelection());
        $('#reset-btn').off('click').on('click', () => this.resetSelection());
        $('#comunidad-select').off('change').on('change', () => this.updateWheel());
    }

    getParticipantsForWheel() {
        const comunidadId = $('#comunidad-select').val();
        return ParticipantsManager.getParticipantsForWheel(comunidadId);
    }

    drawWheel() {
        const participants = this.getParticipantsForWheel();
        if (participants.length === 0) {
            this.drawEmptyWheel();
            return;
        }

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        const anglePer = (2 * Math.PI) / participants.length;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(this.wheelRotation);

        // Dibujar segmentos
        participants.forEach((participant, i) => {
            const startAngle = i * anglePer;
            const endAngle = (i + 1) * anglePer;

            // Segmento
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.arc(0, 0, radius, startAngle, endAngle);
            this.ctx.closePath();
            
            const color = this.getSegmentColor(i, participants.length);
            this.ctx.fillStyle = color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.stroke();

            // Texto
            this.ctx.save();
            this.ctx.rotate(startAngle + anglePer / 2);
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#000';
            
            const fontSize = this.calculateFontSize(participant);
            this.ctx.font = `bold ${fontSize}px Arial`;
            
            const displayName = this.truncateName(participant);
            this.ctx.fillText(displayName, radius - 40, 0);
            this.ctx.restore();
        });

        this.ctx.restore();

        // Centro
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#00000044';
        this.ctx.stroke();
    }

    drawEmptyWheel() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Círculo gris
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 150, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fill();
        this.ctx.strokeStyle = '#dee2e6';
        this.ctx.stroke();
        
        // Texto
        this.ctx.fillStyle = '#6c757d';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('No hay participantes', centerX, centerY);
    }

    getSegmentColor(index, total) {
        const hue = (index * 360 / total) % 360;
        return `hsl(${hue}, 70%, 60%)`;
    }

    calculateFontSize(name) {
        if (name.length > 20) return 10;
        if (name.length > 15) return 11;
        return 12;
    }

    truncateName(name) {
        if (name.length > 25) return name.substring(0, 22) + '...';
        return name;
    }

    startSelection() {
        if (this.isSpinning) return;
        
        const count = parseInt($('#selection-count').val());
        const participants = this.getParticipantsForWheel();
        
        if (participants.length === 0) {
            this.showNotification('No hay participantes disponibles', 'warning');
            return;
        }

        if (count > participants.length) {
            this.showNotification(`Solo hay ${participants.length} participantes disponibles`, 'warning');
            return;
        }

        this.selectedParticipants = this.selectRandomParticipants(participants, count);
        this.currentSelectionIndex = 0;
        $('#selected-persons').empty();
        $('#counter').text(`0/${count}`);
        
        this.startNextSelection();
    }

    selectRandomParticipants(participants, count) {
        const shuffled = [...participants].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    startNextSelection() {
        if (this.currentSelectionIndex >= this.selectedParticipants.length) {
            this.showNotification('Selección completada', 'success');
            return;
        }

        const participant = this.selectedParticipants[this.currentSelectionIndex];
        const participants = this.getParticipantsForWheel();
        const targetIndex = participants.indexOf(participant);

        if (targetIndex === -1) {
            console.warn('Participante no encontrado:', participant);
            this.currentSelectionIndex++;
            setTimeout(() => this.startNextSelection(), 200);
            return;
        }

        this.spinToTarget(targetIndex, () => {
            this.handleWinner(participant);
            this.currentSelectionIndex++;
            
            if (this.currentSelectionIndex < this.selectedParticipants.length) {
                setTimeout(() => this.startNextSelection(), 1000);
            }
        });
    }

    spinToTarget(targetIndex, onFinish) {
        this.isSpinning = true;
        $('#selected-name').text('Girando...');
        $('#selected-status').text('Seleccionando').removeClass('badge-success').addClass('badge-warning');

        const participants = this.getParticipantsForWheel();
        const segment = (2 * Math.PI) / participants.length;
        const pointerOffset = -Math.PI / 2;
        const base = pointerOffset - (targetIndex * segment + segment / 2);
        
        const twoPI = 2 * Math.PI;
        let cyclesNeeded = Math.ceil((this.wheelRotation - base) / twoPI);
        cyclesNeeded += 4;

        const targetRotation = base + cyclesNeeded * twoPI;
        const startRotation = this.wheelRotation;
        const rotationDiff = targetRotation - startRotation;
        const startTime = performance.now();
        
        // Usar configuración por defecto si app no está disponible
        const spinDuration = (window.app && window.app.settings) ? window.app.settings.spinDuration : 4;
        const duration = spinDuration * 1000;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easing = 1 - Math.pow(1 - progress, 3);
            
            this.wheelRotation = startRotation + rotationDiff * easing;
            this.drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Ajuste final
                const endedIndex = this.getIndexAtPointer();
                if (endedIndex !== targetIndex) {
                    const correction = (targetIndex - endedIndex) * segment;
                    this.wheelRotation += correction;
                    this.drawWheel();
                }
                
                this.isSpinning = false;
                if (onFinish) onFinish();
            }
        };

        requestAnimationFrame(animate);
    }

    getIndexAtPointer() {
        const participants = this.getParticipantsForWheel();
        const segment = (2 * Math.PI) / participants.length;
        let value = (-Math.PI / 2 - this.wheelRotation) / segment;
        let idx = Math.floor(value);
        return ((idx % participants.length) + participants.length) % participants.length;
    }

    handleWinner(participant) {
        $('#selected-name').text(participant);
        $('#selected-status').text('¡Seleccionado!').removeClass('badge-warning').addClass('badge-success');

        // Texto a voz
        if (window.app && window.app.settings && window.app.settings.textToSpeech) {
            this.speakName(participant);
        }

        // Agregar a la lista
        const personElement = $(`
            <div class="selected-person">
                <i class="fas fa-user"></i>
                <span>${participant}</span>
            </div>
        `);
        $('#selected-persons').append(personElement);

        // Actualizar contador
        $('#counter').text(`${this.currentSelectionIndex + 1}/${this.selectedParticipants.length}`);

        // Registrar en estadísticas
        if (typeof StatisticsManager !== 'undefined') {
            StatisticsManager.recordSelection(participant);
        }
        
        if (typeof ParticipantsManager !== 'undefined') {
            ParticipantsManager.incrementSelectionCount(participant);
        }

        // Efectos visuales
        this.createCelebrationEffects();
    }

    speakName(name) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(name);
            utterance.lang = 'es-ES';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        }
    }

    createCelebrationEffects() {
        $('#selected-name').addClass('animate__animated animate__pulse');
        setTimeout(() => {
            $('#selected-name').removeClass('animate__animated animate__pulse');
        }, 1000);
    }

    resetSelection() {
        if (this.isSpinning) return;
        
        this.selectedParticipants = [];
        this.currentSelectionIndex = 0;
        this.wheelRotation = 0;
        
        $('#selected-name').text('Esperando...');
        $('#selected-status').text('Listo').removeClass('badge-warning badge-success').addClass('badge-primary');
        $('#selected-persons').empty();
        $('#counter').text('0/0');
        
        this.drawWheel();
    }

    updateWheel() {
        this.drawWheel();
    }

    showNotification(message, type) {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Inicializar la rueda después de que todo esté cargado
$(document).ready(() => {
    setTimeout(() => {
        window.wheelManager = new WheelManager();
    }, 200);
});