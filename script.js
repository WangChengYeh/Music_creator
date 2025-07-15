class MusicEditor {
    constructor() {
        this.notes = [];
        this.selectedNote = null;
        this.isPlaying = false;
        this.noteCounter = 0;
        
        // 音高對應表 (y座標對應音符)
        this.pitchMap = {
            70: 'C6',  // 高音C
            80: 'B5',  // 高音B
            90: 'A5',  // 高音A
            100: 'G5', // 高音G
            110: 'F5', // 高音F
            120: 'E5', // 高音E
            130: 'D5', // 高音D
            140: 'C5', // 中音C
            150: 'B4', // 中音B
            160: 'A4', // 中音A
            170: 'G4'  // 中音G
        };
        
        this.initializeEventListeners();
        this.createAudioContext();
    }
    
    initializeEventListeners() {
        // 工具欄按鈕
        document.getElementById('addNote').addEventListener('click', () => this.addNote());
        document.getElementById('playButton').addEventListener('click', () => this.togglePlayback());
        document.getElementById('clearAll').addEventListener('click', () => this.clearAllNotes());
        
        // 五線譜點擊事件
        document.getElementById('musicStaff').addEventListener('click', (e) => this.handleStaffClick(e));
        
        // 鍵盤事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    createAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    addNote(x = 100, y = 120) {
        const noteType = document.getElementById('noteType').value;
        const noteId = `note_${this.noteCounter++}`;
        
        const note = {
            id: noteId,
            x: x,
            y: y,
            width: this.getNoteWidth(noteType),
            type: noteType,
            pitch: this.getPitchFromY(y),
            element: null
        };
        
        this.createNoteElement(note);
        this.notes.push(note);
        this.updateInfoPanel();
    }
    
    getNoteWidth(type) {
        const widths = {
            eighth: 30,
            quarter: 40,
            half: 60,
            whole: 80
        };
        return widths[type] || 40;
    }
    
    createNoteElement(note) {
        const svg = document.getElementById('musicStaff');
        const notesContainer = document.getElementById('notesContainer');
        
        // 創建音符群組
        const noteGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        noteGroup.classList.add('note');
        noteGroup.setAttribute('data-note-id', note.id);
        
        // 音符方塊
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.classList.add('note-rect', note.type);
        rect.setAttribute('x', note.x);
        rect.setAttribute('y', note.y - 10);
        rect.setAttribute('width', note.width);
        rect.setAttribute('height', 20);
        
        // 音符文字
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.classList.add('note-text');
        text.setAttribute('x', note.x + note.width / 2);
        text.setAttribute('y', note.y + 5);
        text.textContent = note.pitch;
        
        // 調整大小控制點
        const resizeHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        resizeHandle.classList.add('resize-handle');
        resizeHandle.setAttribute('cx', note.x + note.width);
        resizeHandle.setAttribute('cy', note.y);
        resizeHandle.setAttribute('r', 6);
        
        noteGroup.appendChild(rect);
        noteGroup.appendChild(text);
        noteGroup.appendChild(resizeHandle);
        notesContainer.appendChild(noteGroup);
        
        note.element = noteGroup;
        
        // 添加事件監聽器
        this.addNoteEventListeners(note);
    }
    
    addNoteEventListeners(note) {
        const element = note.element;
        let isDragging = false;
        let isResizing = false;
        let startX, startY, startWidth;
        
        // 鼠標按下
        element.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.selectNote(note);
            
            const rect = element.getBoundingClientRect();
            const svgRect = document.getElementById('musicStaff').getBoundingClientRect();
            
            startX = e.clientX - svgRect.left;
            startY = e.clientY - svgRect.top;
            
            // 檢查是否點擊了調整大小控制點
            if (e.target.classList.contains('resize-handle')) {
                isResizing = true;
                startWidth = note.width;
                element.style.cursor = 'ew-resize';
            } else {
                isDragging = true;
                element.classList.add('dragging');
                element.style.cursor = 'move';
            }
        });
        
        // 鼠標移動
        const handleMouseMove = (e) => {
            if (!isDragging && !isResizing) return;
            
            const svgRect = document.getElementById('musicStaff').getBoundingClientRect();
            const currentX = e.clientX - svgRect.left;
            const currentY = e.clientY - svgRect.top;
            
            if (isDragging) {
                // 拖拽移動
                const deltaX = currentX - startX;
                const deltaY = currentY - startY;
                
                const newX = Math.max(50, Math.min(700, note.x + deltaX));
                const newY = Math.max(70, Math.min(170, this.snapToStaffLine(note.y + deltaY)));
                
                this.updateNotePosition(note, newX, newY);
                startX = currentX;
                startY = currentY;
            } else if (isResizing) {
                // 調整大小
                const deltaX = currentX - startX;
                const newWidth = Math.max(20, startWidth + deltaX);
                
                this.updateNoteWidth(note, newWidth);
            }
        };
        
        // 鼠標釋放
        const handleMouseUp = () => {
            if (isDragging) {
                element.classList.remove('dragging');
                isDragging = false;
            }
            if (isResizing) {
                isResizing = false;
            }
            element.style.cursor = 'move';
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        // 雙擊播放音符
        element.addEventListener('dblclick', () => {
            this.playNote(note);
        });
    }
    
    snapToStaffLine(y) {
        const staffLines = [80, 100, 120, 140, 160];
        const closest = staffLines.reduce((prev, curr) => 
            Math.abs(curr - y) < Math.abs(prev - y) ? curr : prev
        );
        return closest;
    }
    
    updateNotePosition(note, x, y) {
        note.x = x;
        note.y = y;
        note.pitch = this.getPitchFromY(y);
        
        const rect = note.element.querySelector('.note-rect');
        const text = note.element.querySelector('.note-text');
        const handle = note.element.querySelector('.resize-handle');
        
        rect.setAttribute('x', x);
        rect.setAttribute('y', y - 10);
        text.setAttribute('x', x + note.width / 2);
        text.setAttribute('y', y + 5);
        text.textContent = note.pitch;
        handle.setAttribute('cx', x + note.width);
        handle.setAttribute('cy', y);
        
        this.updateInfoPanel();
    }
    
    updateNoteWidth(note, width) {
        note.width = width;
        
        const rect = note.element.querySelector('.note-rect');
        const text = note.element.querySelector('.note-text');
        const handle = note.element.querySelector('.resize-handle');
        
        rect.setAttribute('width', width);
        text.setAttribute('x', note.x + width / 2);
        handle.setAttribute('cx', note.x + width);
        
        this.updateInfoPanel();
    }
    
    selectNote(note) {
        // 取消之前選中的音符
        if (this.selectedNote) {
            this.selectedNote.element.classList.remove('selected');
        }
        
        // 選中新音符
        this.selectedNote = note;
        note.element.classList.add('selected');
        
        this.updateInfoPanel();
    }
    
    getPitchFromY(y) {
        const closestY = this.snapToStaffLine(y);
        return this.pitchMap[closestY] || 'C5';
    }
    
    getFrequencyFromPitch(pitch) {
        const pitchFrequencies = {
            'C6': 1046.50, 'B5': 987.77, 'A5': 880.00, 'G5': 783.99, 'F5': 698.46,
            'E5': 659.25, 'D5': 587.33, 'C5': 523.25, 'B4': 493.88, 'A4': 440.00, 'G4': 392.00
        };
        return pitchFrequencies[pitch] || 440;
    }
    
    playNote(note) {
        if (!this.audioContext) return;
        
        const frequency = this.getFrequencyFromPitch(note.pitch);
        const duration = (note.width / 40) * 0.5; // 根據寬度計算持續時間
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    handleStaffClick(e) {
        const svgRect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - svgRect.left;
        const y = e.clientY - svgRect.top;
        
        // 只在五線譜區域內添加音符
        if (x >= 50 && x <= 750 && y >= 70 && y <= 170) {
            const snappedY = this.snapToStaffLine(y);
            this.addNote(x, snappedY);
        }
    }
    
    togglePlayback() {
        const button = document.getElementById('playButton');
        const playbackLine = document.getElementById('playbackLine');
        
        if (this.isPlaying) {
            this.stopPlayback();
            button.textContent = '播放';
        } else {
            this.startPlayback();
            button.textContent = '停止';
        }
    }
    
    startPlayback() {
        this.isPlaying = true;
        const playbackLine = document.getElementById('playbackLine');
        const svg = document.getElementById('musicStaff');
        
        playbackLine.style.display = 'block';
        playbackLine.style.transform = 'translateX(0)';
        
        // 播放動畫
        const duration = 4000; // 4秒播放完整個五線譜
        playbackLine.style.transition = `transform ${duration}ms linear`;
        
        setTimeout(() => {
            playbackLine.style.transform = 'translateX(650px)';
        }, 50);
        
        // 播放音符
        this.playNotesInSequence(duration);
        
        // 播放結束後重置
        setTimeout(() => {
            this.stopPlayback();
            document.getElementById('playButton').textContent = '播放';
        }, duration);
    }
    
    stopPlayback() {
        this.isPlaying = false;
        const playbackLine = document.getElementById('playbackLine');
        playbackLine.style.display = 'none';
        playbackLine.style.transition = 'none';
        playbackLine.style.transform = 'translateX(0)';
    }
    
    playNotesInSequence(totalDuration) {
        const sortedNotes = [...this.notes].sort((a, b) => a.x - b.x);
        
        sortedNotes.forEach(note => {
            const timeOffset = ((note.x - 50) / 650) * totalDuration;
            setTimeout(() => {
                if (this.isPlaying) {
                    this.playNote(note);
                    // 高亮播放中的音符
                    note.element.style.filter = 'drop-shadow(0 0 15px rgba(255, 215, 0, 1))';
                    setTimeout(() => {
                        note.element.style.filter = '';
                    }, 200);
                }
            }, timeOffset);
        });
    }
    
    clearAllNotes() {
        if (confirm('確定要清除所有音符嗎？')) {
            this.notes.forEach(note => {
                note.element.remove();
            });
            this.notes = [];
            this.selectedNote = null;
            this.updateInfoPanel();
        }
    }
    
    handleKeyDown(e) {
        if (!this.selectedNote) return;
        
        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                this.deleteSelectedNote();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.moveSelectedNote(-10, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.moveSelectedNote(10, 0);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.moveSelectedNote(0, -20);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.moveSelectedNote(0, 20);
                break;
            case ' ':
                e.preventDefault();
                this.playNote(this.selectedNote);
                break;
        }
    }
    
    deleteSelectedNote() {
        if (!this.selectedNote) return;
        
        const index = this.notes.indexOf(this.selectedNote);
        if (index > -1) {
            this.selectedNote.element.remove();
            this.notes.splice(index, 1);
            this.selectedNote = null;
            this.updateInfoPanel();
        }
    }
    
    moveSelectedNote(deltaX, deltaY) {
        if (!this.selectedNote) return;
        
        const newX = Math.max(50, Math.min(700, this.selectedNote.x + deltaX));
        const newY = Math.max(70, Math.min(170, this.snapToStaffLine(this.selectedNote.y + deltaY)));
        
        this.updateNotePosition(this.selectedNote, newX, newY);
    }
    
    updateInfoPanel() {
        const infoDiv = document.getElementById('noteInfo');
        
        if (this.selectedNote) {
            const duration = (this.selectedNote.width / 40) * 0.5;
            const position = ((this.selectedNote.x - 50) / 650) * 100;
            
            infoDiv.innerHTML = `
                <strong>已選中音符:</strong><br>
                音高: ${this.selectedNote.pitch}<br>
                類型: ${this.getTypeDisplayName(this.selectedNote.type)}<br>
                持續時間: ${duration.toFixed(2)}秒<br>
                位置: ${position.toFixed(1)}%<br>
                <small>使用方向鍵移動，空格鍵播放，Delete刪除</small>
            `;
        } else {
            infoDiv.innerHTML = `
                <strong>音符編輯器使用說明:</strong><br>
                • 點擊五線譜添加音符<br>
                • 拖拽音符改變位置和音高<br>
                • 拖拽右側控制點調整音符長度<br>
                • 雙擊音符播放聲音<br>
                • 總音符數: ${this.notes.length}
            `;
        }
    }
    
    getTypeDisplayName(type) {
        const names = {
            eighth: '八分音符',
            quarter: '四分音符',
            half: '二分音符',
            whole: '全音符'
        };
        return names[type] || type;
    }
}

// 初始化音樂編輯器
document.addEventListener('DOMContentLoaded', () => {
    window.musicEditor = new MusicEditor();
});

// 添加一些範例音符
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.musicEditor) {
            // 添加一些示例音符
            window.musicEditor.addNote(120, 120); // C5
            window.musicEditor.addNote(200, 100); // G5
            window.musicEditor.addNote(280, 140); // C5
            window.musicEditor.addNote(360, 120); // E5
        }
    }, 500);
});
