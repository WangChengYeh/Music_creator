class MusicEditor {
    constructor() {
        this.sections = [];
        this.currentSectionId = 1;
        this.sectionCounter = 1;
        this.notes = [];
        this.selectedNote = null;
        this.isPlaying = false;
        this.noteCounter = 0;
        
        // 語音錄音相關
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioStream = null;
        this.audioContext = null;
        this.analyser = null;
        this.recordingStartTime = null;
        this.pitchData = [];
        this.originalNotes = new Map(); // 儲存原始音符資料
        
        // 音高對應表 (y座標對應音符)
        this.pitchMap = {
            50: 'C6',  // 高音C
            60: 'B5',  // 高音B
            70: 'A5',  // 高音A
            80: 'G5', // 高音G
            90: 'F5', // 高音F
            100: 'E5', // 高音E
            110: 'D5', // 高音D
            120: 'C5', // 中音C
            130: 'B4', // 中音B
            140: 'A4', // 中音A
            150: 'G4'  // 中音G
        };
        
        // 頻率到音符的映射
        this.frequencyToPitch = {
            261.63: 'C4', 277.18: 'C#4', 293.66: 'D4', 311.13: 'D#4',
            329.63: 'E4', 349.23: 'F4', 369.99: 'F#4', 392.00: 'G4',
            415.30: 'G#4', 440.00: 'A4', 466.16: 'A#4', 493.88: 'B4',
            523.25: 'C5', 554.37: 'C#5', 587.33: 'D5', 622.25: 'D#5',
            659.25: 'E5', 698.46: 'F5', 739.99: 'F#5', 783.99: 'G5',
            830.61: 'G#5', 880.00: 'A5', 932.33: 'A#5', 987.77: 'B5',
            1046.50: 'C6'
        };
        
        this.initializeSections();
        this.initializeEventListeners();
        this.createAudioContext();
        this.initializeVoiceRecording();
    }
    
    initializeSections() {
        // 初始化第一個段落
        this.sections.push({
            id: 1,
            notes: [],
            active: true
        });
        this.setActiveSection(1);
    }
    
    addSection() {
        this.sectionCounter++;
        const newSectionId = this.sectionCounter;
        
        // 添加到段落數組
        this.sections.push({
            id: newSectionId,
            notes: [],
            active: false
        });
        
        // 創建 DOM 元素
        const sectionsContainer = document.getElementById('sectionsContainer');
        const newSection = document.createElement('div');
        newSection.className = 'music-section';
        newSection.setAttribute('data-section-id', newSectionId);
        
        newSection.innerHTML = `
            <div class="section-header">
                <h3>段落 ${newSectionId}</h3>
                <button class="delete-section-btn" onclick="musicEditor.deleteSection(${newSectionId})">×</button>
            </div>
            <div class="staff-container">
                <svg class="musicStaff" width="700" height="200" data-section="${newSectionId}">
                    <!-- 五線譜線條 -->
                    <g class="staff-lines">
                        <line x1="50" y1="60" x2="650" y2="60" stroke="#333" stroke-width="1"/>
                        <line x1="50" y1="80" x2="650" y2="80" stroke="#333" stroke-width="1"/>
                        <line x1="50" y1="100" x2="650" y2="100" stroke="#333" stroke-width="1"/>
                        <line x1="50" y1="120" x2="650" y2="120" stroke="#333" stroke-width="1"/>
                        <line x1="50" y1="140" x2="650" y2="140" stroke="#333" stroke-width="1"/>
                    </g>
                    
                    <!-- 時間格線 -->
                    <g class="time-grid">
                        <line x1="100" y1="40" x2="100" y2="160" stroke="#ddd" stroke-width="1"/>
                        <line x1="150" y1="40" x2="150" y2="160" stroke="#ddd" stroke-width="1"/>
                        <line x1="200" y1="40" x2="200" y2="160" stroke="#ddd" stroke-width="1"/>
                        <line x1="250" y1="40" x2="250" y2="160" stroke="#ddd" stroke-width="1"/>
                        <line x1="300" y1="40" x2="300" y2="160" stroke="#ddd" stroke-width="1"/>
                        <line x1="350" y1="40" x2="350" y2="160" stroke="#ddd" stroke-width="1"/>
                        <line x1="400" y1="40" x2="400" y2="160" stroke="#ddd" stroke-width="1"/>
                        <line x1="450" y1="40" x2="450" y2="160" stroke="#ddd" stroke-width="1"/>
                        <line x1="500" y1="40" x2="500" y2="160" stroke="#ddd" stroke-width="1"/>
                        <line x1="550" y1="40" x2="550" y2="160" stroke="#ddd" stroke-width="1"/>
                        <line x1="600" y1="40" x2="600" y2="160" stroke="#ddd" stroke-width="1"/>
                    </g>

                    <!-- 音符容器 -->
                    <g class="notesContainer"></g>
                    
                    <!-- 播放指示線 -->
                    <line class="playbackLine" x1="50" y1="40" x2="50" y2="160" 
                          stroke="red" stroke-width="2" style="display: none;"/>
                </svg>
            </div>
        `;
        
        sectionsContainer.appendChild(newSection);
        
        // 為新段落添加事件監聽器
        this.addSectionEventListeners(newSection);
        
        // 設置為當前活動段落
        this.setActiveSection(newSectionId);
        
        this.updateInfoPanel();
    }
    
    deleteSection(sectionId) {
        if (this.sections.length <= 1) {
            alert('至少需要保留一個段落！');
            return;
        }
        
        // 從數組中移除
        this.sections = this.sections.filter(section => section.id !== sectionId);
        
        // 從 DOM 中移除
        const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (sectionElement) {
            sectionElement.remove();
        }
        
        // 如果刪除的是當前活動段落，設置第一個段落為活動段落
        if (this.currentSectionId === sectionId) {
            this.setActiveSection(this.sections[0].id);
        }
        
        this.updateInfoPanel();
    }
    
    setActiveSection(sectionId) {
        // 移除所有段落的活動狀態
        document.querySelectorAll('.music-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // 設置新的活動段落
        const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (sectionElement) {
            sectionElement.classList.add('active');
        }
        
        // 更新段落狀態
        this.sections.forEach(section => {
            section.active = section.id === sectionId;
        });
        
        this.currentSectionId = sectionId;
        this.updateInfoPanel();
    }
    
    getCurrentSection() {
        return this.sections.find(section => section.id === this.currentSectionId);
    }
    
    addSectionEventListeners(sectionElement) {
        const svg = sectionElement.querySelector('.musicStaff');
        const sectionId = parseInt(sectionElement.getAttribute('data-section-id'));
        
        // 點擊段落設置為活動段落
        sectionElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-section-btn')) {
                this.setActiveSection(sectionId);
            }
        });
        
        // 五線譜點擊事件
        svg.addEventListener('click', (e) => this.handleStaffClick(e, sectionId));
    }
    
    initializeEventListeners() {
        // 工具欄按鈕
        document.getElementById('addNote').addEventListener('click', () => this.addNote());
        document.getElementById('addTextNote').addEventListener('click', () => this.addTextNote());
        document.getElementById('addTextSequence').addEventListener('click', () => this.addTextSequence());
        document.getElementById('playButton').addEventListener('click', () => this.togglePlayback());
        document.getElementById('clearAll').addEventListener('click', () => this.clearAllNotes());
        
        // 段落操作按鈕
        document.getElementById('addSection').addEventListener('click', () => this.addSection());
        document.getElementById('playCurrentSection').addEventListener('click', () => this.playCurrentSection());
        document.getElementById('clearCurrentSection').addEventListener('click', () => this.clearCurrentSection());
        
        // 語音錄音按鈕
        document.getElementById('startRecording').addEventListener('click', () => this.startRecording());
        document.getElementById('stopRecording').addEventListener('click', () => this.stopRecording());
        document.getElementById('analyzeVoice').addEventListener('click', () => this.analyzeVoiceForCurrentSection());
        document.getElementById('applyPitchCorrection').addEventListener('click', () => this.applyPitchCorrections());
        document.getElementById('resetOriginal').addEventListener('click', () => this.resetToOriginal());
        
        // 文字輸入框事件
        const textInput = document.getElementById('noteText');
        textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTextSequence();
            }
        });
        
        // 初始化第一個段落的事件監聽器
        const firstSection = document.querySelector('.music-section');
        this.addSectionEventListeners(firstSection);
        
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
    
    addNote(x = 100, y = 100, sectionId = null) {
        const targetSectionId = sectionId || this.currentSectionId;
        const section = this.sections.find(s => s.id === targetSectionId);
        
        if (!section) return;
        
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
            element: null,
            sectionId: targetSectionId
        };
        
        this.createNoteElement(note, targetSectionId);
        section.notes.push(note);
        this.updateInfoPanel();
    }
    
    addTextNote(x = 100, y = 100, sectionId = null) {
        const targetSectionId = sectionId || this.currentSectionId;
        const section = this.sections.find(s => s.id === targetSectionId);
        
        if (!section) return;
        
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
            element: null,
            sectionId: targetSectionId
        };
        
        this.createNoteElement(note, targetSectionId);
        section.notes.push(note);
        
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
    
    createNoteElement(note, sectionId) {
        const targetSectionId = sectionId || note.sectionId || this.currentSectionId;
        const sectionElement = document.querySelector(`[data-section-id="${targetSectionId}"]`);
        const notesContainer = sectionElement.querySelector('.notesContainer');
        
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
        
        noteGroup.appendChild(rect);
        noteGroup.appendChild(text);
        notesContainer.appendChild(noteGroup);
        
        note.element = noteGroup;
        
        // 添加事件監聽器
        this.addNoteEventListeners(note);
    }
    
    addNoteEventListeners(note) {
        const element = note.element;
        
        // 只處理點擊選中，不啟動拖拽
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNote(note);
        });
        
        // 雙擊播放音符
        element.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.playNote(note);
        });
        
        // 右鍵菜單 - 未來可以添加複製、刪除等功能
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showContextMenu(note, e);
        });
    }
    
    showContextMenu(note, event) {
        // 移除現有的右鍵菜單
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        // 創建右鍵菜單
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'fixed';
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
        menu.style.backgroundColor = 'white';
        menu.style.border = '1px solid #ccc';
        menu.style.borderRadius = '5px';
        menu.style.padding = '5px 0';
        menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        menu.style.zIndex = '1000';
        
        // 播放選項
        const playOption = document.createElement('div');
        playOption.textContent = '播放音符';
        playOption.style.padding = '8px 16px';
        playOption.style.cursor = 'pointer';
        playOption.addEventListener('mouseover', () => playOption.style.backgroundColor = '#f0f0f0');
        playOption.addEventListener('mouseout', () => playOption.style.backgroundColor = 'white');
        playOption.addEventListener('click', () => {
            this.playNote(note);
            menu.remove();
        });
        
        // 刪除選項
        const deleteOption = document.createElement('div');
        deleteOption.textContent = '刪除音符';
        deleteOption.style.padding = '8px 16px';
        deleteOption.style.cursor = 'pointer';
        deleteOption.style.color = '#d32f2f';
        deleteOption.addEventListener('mouseover', () => deleteOption.style.backgroundColor = '#f0f0f0');
        deleteOption.addEventListener('mouseout', () => deleteOption.style.backgroundColor = 'white');
        deleteOption.addEventListener('click', () => {
            this.deleteNote(note);
            menu.remove();
        });
        
        menu.appendChild(playOption);
        menu.appendChild(deleteOption);
        document.body.appendChild(menu);
        
        // 點擊其他地方關閉菜單
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 100);
    }
    
    deleteNote(note) {
        // 從數組中移除
        const index = this.notes.indexOf(note);
        if (index > -1) {
            this.notes.splice(index, 1);
        }
        
        // 從 DOM 中移除
        if (note.element) {
            note.element.remove();
        }
        
        // 如果刪除的是選中的音符，清除選擇
        if (this.selectedNote === note) {
            this.selectedNote = null;
        }
        
        this.updateInfoPanel();
    }

    snapToStaffLine(y) {
        const staffLines = [80, 100, 120, 140, 160];
        const closest = staffLines.reduce((prev, curr) => 
            Math.abs(curr - y) < Math.abs(prev - y) ? curr : prev
        );
        return closest;
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
    
    handleStaffClick(e, sectionId) {
        const svgRect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - svgRect.left;
        const y = e.clientY - svgRect.top;
        
        // 設置點擊的段落為活動段落
        this.setActiveSection(sectionId);
        
        // 只在五線譜區域內添加音符
        if (x >= 50 && x <= 650 && y >= 50 && y <= 150) {
            const snappedY = this.snapToStaffLine(y);
            
            // 檢查是否有文字輸入
            const textInput = document.getElementById('noteText');
            if (textInput.value.trim()) {
                this.addTextNote(x, snappedY, sectionId);
            } else {
                this.addNote(x, snappedY, sectionId);
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
    
    playCurrentSection() {
        const currentSection = this.getCurrentSection();
        if (!currentSection || currentSection.notes.length === 0) {
            alert('當前段落沒有音符可播放！');
            return;
        }
        
        this.playSection(currentSection);
    }
    
    clearCurrentSection() {
        const currentSection = this.getCurrentSection();
        if (!currentSection) return;
        
        if (confirm('確定要清除當前段落的所有音符嗎？')) {
            // 從 DOM 中移除音符
            currentSection.notes.forEach(note => {
                if (note.element) {
                    note.element.remove();
                }
            });
            
            // 清空段落的音符數組
            currentSection.notes = [];
            
            // 如果選中的音符在當前段落，清除選擇
            if (this.selectedNote && currentSection.notes.includes(this.selectedNote)) {
                this.selectedNote = null;
            }
            
            this.updateInfoPanel();
        }
    }
    
    playSection(section) {
        if (!this.audioContext || section.notes.length === 0) return;
        
        // 按 x 座標排序音符
        const sortedNotes = [...section.notes].sort((a, b) => a.x - b.x);
        
        let delay = 0;
        sortedNotes.forEach((note, index) => {
            setTimeout(() => {
                this.playNote(note);
            }, delay);
            delay += 500; // 每個音符間隔 500ms
        });
    }

    async initializeVoiceRecording() {
        try {
            // 檢查瀏覽器支援
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.warn('瀏覽器不支援麥克風錄音功能');
                return;
            }
            
            // 初始化音高視覺化畫布
            this.initializePitchVisualization();
            
        } catch (error) {
            console.error('初始化語音錄音失敗:', error);
        }
    }
    
    async startRecording() {
        try {
            // 請求麥克風權限
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            // 設置音頻分析
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const source = this.audioContext.createMediaStreamSource(this.audioStream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 4096;
            this.analyser.smoothingTimeConstant = parseFloat(document.getElementById('smoothing').value);
            
            source.connect(this.analyser);
            
            // 開始錄音
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            this.pitchData = [];
            
            // 更新 UI
            this.updateRecordingUI(true);
            
            // 開始音高分析循環
            this.analyzePitch();
            
            // 開始計時器
            this.startRecordingTimer();
            
        } catch (error) {
            console.error('開始錄音失敗:', error);
            alert('無法訪問麥克風，請檢查權限設置');
        }
    }
    
    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        // 停止音頻流
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
        }
        
        // 更新 UI
        this.updateRecordingUI(false);
        
        // 啟用分析按鈕
        document.getElementById('analyzeVoice').disabled = false;
        
        console.log('錄音完成，收集到', this.pitchData.length, '個音高數據點');
    }
    
    updateRecordingUI(isRecording) {
        const startBtn = document.getElementById('startRecording');
        const stopBtn = document.getElementById('stopRecording');
        const indicator = document.getElementById('recordingIndicator');
        
        startBtn.disabled = isRecording;
        stopBtn.disabled = !isRecording;
        
        if (isRecording) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    }
    
    startRecordingTimer() {
        const timeDisplay = document.getElementById('recordingTime');
        
        const updateTimer = () => {
            if (!this.isRecording) return;
            
            const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            setTimeout(updateTimer, 1000);
        };
        
        updateTimer();
    }
    
    analyzePitch() {
        if (!this.isRecording || !this.analyser) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);
        this.analyser.getFloatFrequencyData(dataArray);
        
        // 找到最強的頻率
        const frequency = this.findFundamentalFrequency(dataArray);
        const sensitivity = parseFloat(document.getElementById('sensitivity').value);
        
        if (frequency > 0) {
            const pitch = this.frequencyToPitch(frequency);
            const timestamp = Date.now() - this.recordingStartTime;
            
            // 只記錄足夠強的信號
            const maxAmplitude = Math.max(...dataArray);
            if (maxAmplitude > -60 * sensitivity) { // 可調整的靈敏度閾值
                this.pitchData.push({
                    frequency,
                    pitch,
                    timestamp,
                    amplitude: maxAmplitude
                });
            }
        }
        
        // 更新視覺化
        this.updatePitchVisualization(frequency);
        
        // 繼續分析
        if (this.isRecording) {
            requestAnimationFrame(() => this.analyzePitch());
        }
    }
    
    findFundamentalFrequency(dataArray) {
        const sampleRate = this.audioContext.sampleRate;
        const nyquist = sampleRate / 2;
        const binSize = nyquist / dataArray.length;
        
        let maxAmplitude = -Infinity;
        let maxIndex = 0;
        
        // 只分析人聲頻率範圍 (80Hz - 1000Hz)
        const minBin = Math.floor(80 / binSize);
        const maxBin = Math.floor(1000 / binSize);
        
        for (let i = minBin; i < maxBin && i < dataArray.length; i++) {
            if (dataArray[i] > maxAmplitude) {
                maxAmplitude = dataArray[i];
                maxIndex = i;
            }
        }
        
        return maxIndex * binSize;
    }
    
    frequencyToPitch(frequency) {
        // 找到最接近的音符
        let closestPitch = 'C4';
        let minDiff = Infinity;
        
        for (const [freq, pitch] of Object.entries(this.frequencyToPitch)) {
            const diff = Math.abs(parseFloat(freq) - frequency);
            if (diff < minDiff) {
                minDiff = diff;
                closestPitch = pitch;
            }
        }
        
        return closestPitch;
    }
    
    initializePitchVisualization() {
        this.pitchCanvas = document.getElementById('pitchVisualization');
        this.pitchCtx = this.pitchCanvas.getContext('2d');
        
        // 設置畫布尺寸
        const rect = this.pitchCanvas.getBoundingClientRect();
        this.pitchCanvas.width = rect.width * window.devicePixelRatio;
        this.pitchCanvas.height = rect.height * window.devicePixelRatio;
        this.pitchCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // 初始化畫布
        this.clearPitchVisualization();
    }
    
    updatePitchVisualization(frequency) {
        if (!this.pitchCtx) return;
        
        const canvas = this.pitchCanvas;
        const ctx = this.pitchCtx;
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;
        
        // 清除畫布
        ctx.clearRect(0, 0, width, height);
        
        // 繪製背景格線
        ctx.strokeStyle = '#e1e8ed';
        ctx.lineWidth = 1;
        
        // 水平線 (音符線)
        const noteLines = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'];
        noteLines.forEach((note, index) => {
            const y = height - (index / (noteLines.length - 1)) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            
            // 標記音符名稱
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.fillText(note, 5, y - 2);
        });
        
        // 繪製當前頻率
        if (frequency > 0) {
            const pitch = this.frequencyToPitch(frequency);
            const noteIndex = noteLines.indexOf(pitch);
            
            if (noteIndex >= 0) {
                const y = height - (noteIndex / (noteLines.length - 1)) * height;
                
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.arc(width - 20, y, 5, 0, 2 * Math.PI);
                ctx.fill();
                
                // 顯示頻率資訊
                document.getElementById('pitchInfo').textContent = 
                    `音符: ${pitch} | 頻率: ${frequency.toFixed(1)}Hz`;
            }
        }
    }
    
    clearPitchVisualization() {
        if (!this.pitchCtx) return;
        
        const width = this.pitchCanvas.width / window.devicePixelRatio;
        const height = this.pitchCanvas.height / window.devicePixelRatio;
        
        this.pitchCtx.clearRect(0, 0, width, height);
        this.pitchCtx.fillStyle = '#f8f9fa';
        this.pitchCtx.fillRect(0, 0, width, height);
    }

    analyzeVoiceForCurrentSection() {
        const currentSection = this.getCurrentSection();
        if (!currentSection || currentSection.notes.length === 0) {
            alert('當前段落沒有音符可以修正！');
            return;
        }
        
        if (this.pitchData.length === 0) {
            alert('沒有錄音數據可以分析！');
            return;
        }
        
        // 儲存原始音符數據
        currentSection.notes.forEach(note => {
            if (!this.originalNotes.has(note.id)) {
                this.originalNotes.set(note.id, {
                    x: note.x,
                    y: note.y,
                    width: note.width,
                    pitch: note.pitch
                });
            }
        });
        
        // 分析錄音數據並生成修正建議
        const corrections = this.generatePitchCorrections(currentSection.notes);
        
        // 顯示分析結果
        this.displayAnalysisResults(corrections);
        
        // 啟用修正按鈕
        document.getElementById('applyPitchCorrection').disabled = false;
        document.getElementById('resetOriginal').disabled = false;
        
        console.log('分析完成，生成了', corrections.length, '個修正建議');
    }
    
    generatePitchCorrections(notes) {
        if (this.pitchData.length === 0) return [];
        
        const corrections = [];
        const totalRecordingTime = this.pitchData[this.pitchData.length - 1].timestamp;
        
        // 為每個音符計算對應的錄音時間段
        notes.forEach((note, index) => {
            const noteStartTime = (index / notes.length) * totalRecordingTime;
            const noteEndTime = ((index + 1) / notes.length) * totalRecordingTime;
            
            // 找到這個時間段內的音高數據
            const relevantData = this.pitchData.filter(data => 
                data.timestamp >= noteStartTime && data.timestamp < noteEndTime
            );
            
            if (relevantData.length > 0) {
                // 計算平均音高和持續時間
                const avgFrequency = relevantData.reduce((sum, data) => sum + data.frequency, 0) / relevantData.length;
                const avgPitch = this.frequencyToPitch(avgFrequency);
                const duration = noteEndTime - noteStartTime;
                
                // 計算音高強度變化（用於調整音符寬度）
                const amplitudes = relevantData.map(data => data.amplitude);
                const avgAmplitude = amplitudes.reduce((sum, amp) => sum + amp, 0) / amplitudes.length;
                const amplitudeVariation = Math.max(...amplitudes) - Math.min(...amplitudes);
                
                // 生成修正建議
                const correction = {
                    noteId: note.id,
                    originalPitch: note.pitch,
                    suggestedPitch: avgPitch,
                    originalY: note.y,
                    suggestedY: this.getYFromPitch(avgPitch),
                    originalWidth: note.width,
                    suggestedWidth: Math.max(30, Math.min(100, note.width * (1 + amplitudeVariation / 50))),
                    confidence: Math.min(1, relevantData.length / 10), // 基於數據點數量的信心度
                    avgAmplitude: avgAmplitude,
                    duration: duration
                };
                
                corrections.push(correction);
            }
        });
        
        return corrections;
    }
    
    getYFromPitch(pitchName) {
        // 反向查找音高對應的 Y 座標
        for (const [y, pitch] of Object.entries(this.pitchMap)) {
            if (pitch === pitchName) {
                return parseInt(y);
            }
        }
        return 120; // 默認位置
    }
    
    displayAnalysisResults(corrections) {
        const pitchInfo = document.getElementById('pitchInfo');
        let resultText = `分析完成！發現 ${corrections.length} 個音符可以修正：\n`;
        
        corrections.forEach((correction, index) => {
            const pitchChange = correction.originalPitch !== correction.suggestedPitch ? '音高' : '';
            const widthChange = Math.abs(correction.originalWidth - correction.suggestedWidth) > 5 ? '寬度' : '';
            const changes = [pitchChange, widthChange].filter(c => c).join('和');
            
            resultText += `音符${index + 1}: ${changes || '無'} (信心度: ${(correction.confidence * 100).toFixed(0)}%)\n`;
        });
        
        pitchInfo.innerHTML = resultText.replace(/\n/g, '<br>');
        
        // 儲存修正數據
        this.currentCorrections = corrections;
    }
    
    applyPitchCorrections() {
        if (!this.currentCorrections || this.currentCorrections.length === 0) {
            alert('沒有修正數據可以應用！');
            return;
        }
        
        const currentSection = this.getCurrentSection();
        if (!currentSection) return;
        
        // 應用修正
        this.currentCorrections.forEach(correction => {
            const note = currentSection.notes.find(n => n.id === correction.noteId);
            if (note) {
                // 更新音符屬性
                note.y = correction.suggestedY;
                note.pitch = correction.suggestedPitch;
                note.width = correction.suggestedWidth;
                
                // 更新 DOM 元素
                const rect = note.element.querySelector('.note-rect');
                const text = note.element.querySelector('.note-text');
                
                rect.setAttribute('y', note.y - 15);
                rect.setAttribute('width', note.width);
                text.setAttribute('x', note.x + note.width / 2);
                text.setAttribute('y', note.y);
                
                if (!note.isTextNote) {
                    text.textContent = note.pitch;
                }
            }
        });
        
        this.updateInfoPanel();
        
        // 顯示成功消息
        document.getElementById('pitchInfo').innerHTML = 
            `✅ 已應用 ${this.currentCorrections.length} 個音高修正！<br>` +
            '音符的音高和寬度已根據您的演唱進行調整。';
    }
    
    resetToOriginal() {
        const currentSection = this.getCurrentSection();
        if (!currentSection) return;
        
        let resetCount = 0;
        
        // 恢復原始數據
        currentSection.notes.forEach(note => {
            const original = this.originalNotes.get(note.id);
            if (original) {
                note.x = original.x;
                note.y = original.y;
                note.width = original.width;
                note.pitch = original.pitch;
                
                // 更新 DOM 元素
                const rect = note.element.querySelector('.note-rect');
                const text = note.element.querySelector('.note-text');
                
                rect.setAttribute('x', note.x);
                rect.setAttribute('y', note.y - 15);
                rect.setAttribute('width', note.width);
                text.setAttribute('x', note.x + note.width / 2);
                text.setAttribute('y', note.y);
                
                if (!note.isTextNote) {
                    text.textContent = note.pitch;
                }
                
                resetCount++;
            }
        });
        
        this.updateInfoPanel();
        
        // 顯示恢復消息
        document.getElementById('pitchInfo').innerHTML = 
            `↩️ 已恢復 ${resetCount} 個音符到原始狀態！`;
    }

    // ...existing code...
}

// 初始化音樂編輯器
let musicEditor;
document.addEventListener('DOMContentLoaded', () => {
    musicEditor = new MusicEditor();
});

// 全局函數（用於 HTML 中的 onclick）
function deleteSection(sectionId) {
    if (musicEditor) {
        musicEditor.deleteSection(sectionId);
    }
}

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
