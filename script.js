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
        document.getElementById('addTextNote').addEventListener('click', () => this.addTextNote());
        document.getElementById('addTextSequence').addEventListener('click', () => this.addTextSequence());
        document.getElementById('playButton').addEventListener('click', () => this.togglePlayback());
        document.getElementById('clearAll').addEventListener('click', () => this.clearAllNotes());
        
        // 文字輸入框事件
        const textInput = document.getElementById('noteText');
        textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTextSequence();
            }
        });
        
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
            text: null,
            isTextNote: false,
            element: null
        };
        
        this.createNoteElement(note);
        this.notes.push(note);
        this.updateInfoPanel();
    }
    
    addTextNote(x = 100, y = 120) {
        const textInput = document.getElementById('noteText');
        const text = textInput.value.trim();
        
        if (!text) {
            alert('請輸入要顯示的文字！');
            textInput.focus();
            return;
        }
        
        const noteId = `text_note_${this.noteCounter++}`;
        
        const note = {
            id: noteId,
            x: x,
            y: y,
            width: Math.max(60, text.length * 25), // 根據文字長度計算寬度
            type: 'text',
            pitch: this.getPitchFromY(y),
            text: text,
            isTextNote: true,
            element: null
        };
        
        this.createNoteElement(note);
        this.notes.push(note);
        
        // 清空輸入框
        textInput.value = '';
        
        this.updateInfoPanel();
    }
    
    addTextSequence() {
        const textInput = document.getElementById('noteText');
        const text = textInput.value.trim();
        
        if (!text) {
            alert('請輸入要轉換的文字！');
            textInput.focus();
            return;
        }
        
        // 字符到音高的映射表
        const charToNote = {
            'a': 160, 'A': 160, // A4
            'b': 150, 'B': 150, // B4
            'c': 140, 'C': 140, // C5
            'd': 130, 'D': 130, // D5
            'e': 120, 'E': 120, // E5
            'f': 110, 'F': 110, // F5
            'g': 100, 'G': 100, // G5
            'h': 90,  'H': 90,  // A5
            'i': 80,  'I': 80,  // B5
            'j': 70,  'J': 70,  // C6
            'k': 160, 'K': 160, // A4
            'l': 150, 'L': 150, // B4
            'm': 140, 'M': 140, // C5
            'n': 130, 'N': 130, // D5
            'o': 120, 'O': 120, // E5
            'p': 110, 'P': 110, // F5
            'q': 100, 'Q': 100, // G5
            'r': 90,  'R': 90,  // A5
            's': 80,  'S': 80,  // B5
            't': 70,  'T': 70,  // C6
            'u': 160, 'U': 160, // A4
            'v': 150, 'V': 150, // B4
            'w': 140, 'W': 140, // C5
            'x': 130, 'X': 130, // D5
            'y': 120, 'Y': 120, // E5
            'z': 110, 'Z': 110, // F5
            '0': 160, '1': 150, '2': 140, '3': 130, '4': 120,
            '5': 110, '6': 100, '7': 90, '8': 80, '9': 70,
            ' ': 170, // 空格對應 G4（休止符）
            '!': 70, '?': 80, '.': 90, ',': 100,
            '你': 160, '我': 150, '他': 140, '她': 130, '它': 120,
            '是': 110, '的': 100, '了': 90, '在': 80, '有': 70,
            '和': 160, '就': 150, '不': 140, '人': 130, '都': 120,
            '一': 110, '二': 100, '三': 90, '四': 80, '五': 70,
            '六': 160, '七': 150, '八': 140, '九': 130, '十': 120
        };
        
        const noteType = document.getElementById('noteType').value;
        const noteWidth = this.getNoteWidth(noteType);
        let currentX = 100; // 起始 X 位置
        const spacing = noteWidth + 10; // 音符間距
        
        // 為每個字符創建音符
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            let y = charToNote[char] || 120; // 默認為 E5
            
            const noteId = `char_note_${this.noteCounter++}`;
            
            const note = {
                id: noteId,
                x: currentX,
                y: y,
                width: noteWidth,
                type: noteType,
                pitch: this.getPitchFromY(y),
                text: char,
                isTextNote: true,
                element: null
            };
            
            this.createNoteElement(note);
            this.notes.push(note);
            
            currentX += spacing;
            
            // 如果超出畫布寬度，換到下一行
            if (currentX > 700) {
                currentX = 100;
                // 可以在這裡添加換行邏輯
            }
        }
        
        // 清空輸入框
        textInput.value = '';
        
        this.updateInfoPanel();
        
        // 顯示成功消息
        alert(`成功轉換了 ${text.length} 個字符為音符！`);
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
        rect.setAttribute('y', note.y - 15);
        rect.setAttribute('width', note.width);
        rect.setAttribute('height', 30);
        
        // 音符文字
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.classList.add('note-text');
        if (note.isTextNote) {
            text.classList.add('custom-text');
        }
        text.setAttribute('x', note.x + note.width / 2);
        text.setAttribute('y', note.y);
        text.textContent = note.isTextNote ? note.text : note.pitch;
        
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
        if (!note.isTextNote) {
            note.pitch = this.getPitchFromY(y);
        }
        
        const rect = note.element.querySelector('.note-rect');
        const text = note.element.querySelector('.note-text');
        const handle = note.element.querySelector('.resize-handle');
        
        rect.setAttribute('x', x);
        rect.setAttribute('y', y - 15);
        text.setAttribute('x', x + note.width / 2);
        text.setAttribute('y', y);
        if (!note.isTextNote) {
            text.textContent = note.pitch;
        }
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
            
            // 檢查是否有文字輸入
            const textInput = document.getElementById('noteText');
            if (textInput.value.trim()) {
                this.addTextNote(x, snappedY);
            } else {
                this.addNote(x, snappedY);
            }
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
            
            if (this.selectedNote.isTextNote) {
                infoDiv.innerHTML = `
                    <strong>已選中文字音符:</strong><br>
                    文字內容: "${this.selectedNote.text}"<br>
                    位置: ${position.toFixed(1)}%<br>
                    寬度: ${this.selectedNote.width}px<br>
                    <small>使用方向鍵移動，拖拽右側控制點調整寬度，Delete刪除</small>
                `;
            } else {
                infoDiv.innerHTML = `
                    <strong>已選中音符:</strong><br>
                    音高: ${this.selectedNote.pitch}<br>
                    類型: ${this.getTypeDisplayName(this.selectedNote.type)}<br>
                    持續時間: ${duration.toFixed(2)}秒<br>
                    位置: ${position.toFixed(1)}%<br>
                    <small>使用方向鍵移動，空格鍵播放，Delete刪除</small>
                `;
            }
        } else {
            infoDiv.innerHTML = `
                <strong>音符編輯器使用說明:</strong><br>
                • 點擊五線譜添加音符<br>
                • 輸入文字後點擊五線譜添加文字音符<br>
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
            
            // 添加文字音符示例
            document.getElementById('noteText').value = '你好';
            window.musicEditor.addTextNote(280, 140);
            
            document.getElementById('noteText').value = '音樂';
            window.musicEditor.addTextNote(400, 120);
            
            // 清空輸入框
            document.getElementById('noteText').value = '';
        }
    }, 500);
});
