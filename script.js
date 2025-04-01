class FactorTree {
    constructor() {
        this.targetNumber = 36;
        this.tree = null;
        this.currentNode = null;
        this.setupEventListeners();
        this.tutorialStep = 0;
        this.isTutorialMode = false;
        this.synth = window.speechSynthesis;
        this.speaking = false;

        // Wait for voices to be loaded
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => {
                const voices = this.synth.getVoices();
                const femaleVoice = voices.find(voice => 
                    voice.name.toLowerCase().includes('female') || 
                    voice.name.toLowerCase().includes('zira') || 
                    voice.name.toLowerCase().includes('samantha')
                );
                if (femaleVoice) {
                    console.log('Female voice selected:', femaleVoice.name);
                }
            };
        }
    }

    setupEventListeners() {
        // Landing page buttons
        document.getElementById('watchTutorial').addEventListener('click', () => this.startTutorial());
        document.getElementById('startExercise').addEventListener('click', () => this.showExercise());

        // Exercise buttons
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('submitFactors').addEventListener('click', () => this.submitFactors());
        document.getElementById('lockButton').addEventListener('click', () => this.lockFactorization());
        
        // Tutorial buttons
        document.getElementById('skipTutorial').addEventListener('click', () => this.endTutorial());
    }

    showSection(sectionId) {
        // Hide all sections
        ['landingPage', 'tutorialSection', 'exerciseSection'].forEach(id => {
            const section = document.getElementById(id);
            section.style.display = 'none';
            section.classList.remove('visible');
        });

        // Show and animate the requested section
        const section = document.getElementById(sectionId);
        section.style.display = 'block';
        // Trigger reflow
        section.offsetHeight;
        section.classList.add('visible');
    }

    showExercise() {
        this.showSection('exerciseSection');
    }

    returnToLanding() {
        this.showSection('landingPage');
    }

    async speak(text, callback = null) {
        if (this.speaking) {
            this.synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1; // Slightly faster rate for more energy
        utterance.pitch = 1.2; // Higher pitch for more enthusiasm
        utterance.volume = 1.0; // Maximum volume for clarity
        
        // Get available voices and select a female voice
        const voices = this.synth.getVoices();
        const femaleVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('zira') ||  // Windows female voice
            voice.name.toLowerCase().includes('samantha') // MacOS female voice
        );
        
        if (femaleVoice) {
            utterance.voice = femaleVoice;
        }
        
        this.speaking = true;

        return new Promise((resolve) => {
            utterance.onend = () => {
                this.speaking = false;
                if (callback) callback();
                resolve();
            };
            this.synth.speak(utterance);
        });
    }

    startGame() {
        const input = document.getElementById('numberInput');
        const number = parseInt(input.value);
        
        if (number < 2) {
            this.speak('Please enter a number greater than 1 to start!');
            return;
        }

        this.targetNumber = number;
        document.getElementById('targetNumber').textContent = number;
        document.querySelector('.game-container').style.display = 'block';
        document.querySelector('.number-selection').style.display = 'none';
        
        this.tree = {
            value: number,
            children: [],
            isPrime: this.isPrime(number)
        };
        
        this.currentNode = this.tree;
        this.renderTree();
        this.updateFactorInputs();
    }

    updateFactorInputs() {
        const factor1Input = document.getElementById('factor1');
        const factor2Input = document.getElementById('factor2');
        const submitButton = document.getElementById('submitFactors');
        
        if (this.currentNode && !this.currentNode.isPrime && this.currentNode.children.length === 0) {
            factor1Input.value = '';
            factor2Input.value = '';
            factor1Input.disabled = false;
            factor2Input.disabled = false;
            submitButton.disabled = false;
            this.speak(`Enter two numbers that multiply to give us ${this.currentNode.value}!`);
        } else {
            factor1Input.disabled = true;
            factor2Input.disabled = true;
            submitButton.disabled = true;
            if (this.currentNode && this.currentNode.children.length > 0) {
                this.speak('This number has already been factored! Let\'s pick another composite number to work on!');
            }
        }
    }

    submitFactors() {
        const factor1 = parseInt(document.getElementById('factor1').value);
        const factor2 = parseInt(document.getElementById('factor2').value);

        if (isNaN(factor1) || isNaN(factor2)) {
            this.speak('Hey! Please enter both factors to continue!');
            return;
        }

        if (factor1 * factor2 !== this.currentNode.value) {
            this.speak(`Oops! ${factor1} times ${factor2} equals ${factor1 * factor2}, not ${this.currentNode.value}. Let's try again!`);
            return;
        }

        this.currentNode.children = [
            { value: factor1, children: [], isPrime: this.isPrime(factor1) },
            { value: factor2, children: [], isPrime: this.isPrime(factor2) }
        ];

        // Clear current node selection after factoring
        this.currentNode = null;
        this.renderTree();
        this.updateFactorInputs();

        // Check if all leaf nodes are prime
        if (this.areAllLeavesPrime()) {
            this.showCompletion();
            this.speak("Amazing job! You've successfully found all the prime factors! Well done!");
        } else {
            this.speak('Now let\'s find another composite number to factorize!');
        }
    }

    renderTree() {
        const treeContainer = document.getElementById(this.isTutorialMode ? 'factorTree' : 'exerciseTree');
        treeContainer.innerHTML = '';
        this.renderNode(this.tree, treeContainer, true);
    }

    renderNode(node, container, isRoot = false) {
        const nodeElement = document.createElement('div');
        nodeElement.className = `node ${node.isPrime ? 'prime' : ''} ${node === this.currentNode ? 'selected' : ''}`;
        nodeElement.textContent = node.value;

        // Only allow clicking on composite numbers that haven't been factored yet
        if (!node.isPrime && node.children.length === 0) {
            nodeElement.addEventListener('click', () => {
                this.currentNode = node;
                this.updateFactorInputs();
                this.renderTree();
            });
        }

        const nodeContainer = document.createElement('div');
        nodeContainer.className = 'node-container';
        nodeContainer.appendChild(nodeElement);

        if (node.children.length > 0) {
            const branchContainer = document.createElement('div');
            branchContainer.className = 'branch-container';
            
            const branch = document.createElement('div');
            branch.className = 'branch';
            
            node.children.forEach(child => {
                const childContainer = document.createElement('div');
                childContainer.className = 'child-container';
                this.renderNode(child, childContainer);
                branch.appendChild(childContainer);
            });

            branchContainer.appendChild(branch);
            nodeContainer.appendChild(branchContainer);
        }

        container.appendChild(nodeContainer);
    }

    isPrime(num) {
        if (num < 2) return false;
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) return false;
        }
        return true;
    }

    areAllLeavesPrime() {
        const checkNode = (node) => {
            if (node.children.length === 0) {
                return node.isPrime;
            }
            return node.children.every(child => checkNode(child));
        };
        return checkNode(this.tree);
    }

    getPrimeFactorization() {
        const getFactors = (node) => {
            if (node.isPrime) {
                return [node.value];
            }
            return node.children.flatMap(child => getFactors(child));
        };

        const factors = getFactors(this.tree);
        const factorCounts = {};
        factors.forEach(factor => {
            factorCounts[factor] = (factorCounts[factor] || 0) + 1;
        });

        return Object.entries(factorCounts)
            .map(([factor, count]) => count > 1 ? `${factor}^${count}` : factor)
            .join(' × ');
    }

    showCompletion() {
        const completion = document.getElementById('completion');
        const primeFactorization = document.getElementById('primeFactorization');
        primeFactorization.textContent = this.getPrimeFactorization();
        completion.style.display = 'block';
    }

    lockFactorization() {
        this.speak('Great work! Let\'s try another number!');
        document.querySelector('.game-container').style.display = 'none';
        document.querySelector('.number-selection').style.display = 'block';
        document.getElementById('completion').style.display = 'none';
    }

    startTutorial() {
        this.isTutorialMode = true;
        this.tutorialStep = 0;
        this.showSection('tutorialSection');
        
        // Reset the tree for tutorial with 90
        this.tree = {
            value: 90,
            children: [],
            isPrime: false
        };
        
        this.renderTree();
        this.nextTutorialStep();
    }

    async nextTutorialStep() {
        const steps = [
            {
                message: "Welcome! Let's learn about prime factorization. We'll break down the number 90 into its prime factors.",
                action: async () => {
                    const rootNode = document.querySelector('.node');
                    if (rootNode) rootNode.classList.add('blink');
                    await this.speak("Welcome! Let's learn about prime factorization. We'll break down the number 90 into its prime factors.");
                    if (rootNode) rootNode.classList.remove('blink');
                }
            },
            {
                message: "A prime number is a number that has exactly two factors: 1 and itself. For example, 2, 3, 5, 7, and 11 are prime numbers.",
                action: async () => {
                    await this.speak("A prime number is a number that has exactly two factors: 1 and itself. For example, 2, 3, 5, 7, and 11 are prime numbers.");
                }
            },
            {
                message: "Let's start with 90. First, we need to find two numbers that multiply to give us 90. Let's use 6 × 15.",
                action: async () => {
                    const rootNode = document.querySelector('.node');
                    if (rootNode) rootNode.classList.add('blink');
                    await this.speak("Let's start with 90. First, we need to find two numbers that multiply to give us 90. Let's use 6 times 15.");
                    if (rootNode) rootNode.classList.remove('blink');
                    
                    this.tree.children = [
                        { value: 6, children: [], isPrime: false },
                        { value: 15, children: [], isPrime: false }
                    ];
                    this.renderTree();
                }
            },
            {
                message: "Now we have 6 and 15. Neither of these is prime, so we need to break them down further.",
                action: async () => {
                    const node6 = document.querySelector('.node:not(.prime):nth-child(1)');
                    const node15 = document.querySelector('.node:not(.prime):nth-child(2)');
                    if (node6) node6.classList.add('blink');
                    if (node15) node15.classList.add('blink');
                    await this.speak("Now we have 6 and 15. Neither of these is prime, so we need to break them down further.");
                    if (node6) node6.classList.remove('blink');
                    if (node15) node15.classList.remove('blink');
                }
            },
            {
                message: "Let's factor 6 first. It can be broken down into 2 × 3.",
                action: async () => {
                    const node6 = document.querySelector('.node:not(.prime):nth-child(1)');
                    if (node6) node6.classList.add('blink');
                    await this.speak("Let's factor 6 first. It can be broken down into 2 times 3.");
                    if (node6) node6.classList.remove('blink');
                    
                    this.tree.children[0].children = [
                        { value: 2, children: [], isPrime: true },
                        { value: 3, children: [], isPrime: true }
                    ];
                    this.renderTree();
                }
            },
            {
                message: "Both 2 and 3 are prime numbers! We can't break them down any further.",
                action: async () => {
                    const primeNodes = document.querySelectorAll('.node.prime:nth-child(1), .node.prime:nth-child(2)');
                    primeNodes.forEach(node => node.classList.add('blink'));
                    await this.speak("Both 2 and 3 are prime numbers! We can't break them down any further.");
                    primeNodes.forEach(node => node.classList.remove('blink'));
                }
            },
            {
                message: "Now let's factor 15. It can be broken down into 3 × 5.",
                action: async () => {
                    const node15 = document.querySelector('.node:not(.prime):nth-child(2)');
                    if (node15) node15.classList.add('blink');
                    await this.speak("Now let's factor 15. It can be broken down into 3 times 5.");
                    if (node15) node15.classList.remove('blink');
                    
                    this.tree.children[1].children = [
                        { value: 3, children: [], isPrime: true },
                        { value: 5, children: [], isPrime: true }
                    ];
                    this.renderTree();
                }
            },
            {
                message: "Both 3 and 5 are also prime numbers! We've now broken 90 down into its prime factors.",
                action: async () => {
                    const primeNodes = document.querySelectorAll('.node.prime:nth-child(3), .node.prime:nth-child(4)');
                    primeNodes.forEach(node => node.classList.add('blink'));
                    await this.speak("Both 3 and 5 are also prime numbers! We've now broken 90 down into its prime factors.");
                    primeNodes.forEach(node => node.classList.remove('blink'));
                }
            },
            {
                message: "Looking at all the prime numbers in our tree, we can write 90 as: 2 × 3 × 3 × 5, or 2 × 3² × 5",
                action: async () => {
                    const primeNodes = document.querySelectorAll('.node.prime');
                    primeNodes.forEach(node => node.classList.add('blink'));
                    await this.speak("Looking at all the prime numbers in our tree, we can write 90 as: 2 times 3 times 3 times 5, or 2 times 3 squared times 5");
                    primeNodes.forEach(node => node.classList.remove('blink'));
                }
            },
            {
                message: "Now you try! Click 'Start Exercise' to begin factoring your own numbers.",
                action: async () => {
                    setTimeout(() => this.endTutorial(), 2000);
                }
            }
        ];

        if (this.tutorialStep < steps.length) {
            const step = steps[this.tutorialStep];
            await step.action();
            this.tutorialStep++;
            if (this.tutorialStep < steps.length) {
                setTimeout(() => this.nextTutorialStep(), 1000);
            }
        }
    }

    endTutorial() {
        if (this.speaking) {
            this.synth.cancel();
        }
        this.isTutorialMode = false;
        document.querySelectorAll('.node.highlight').forEach(node => {
            node.classList.remove('highlight');
        });
        this.returnToLanding();
    }
}

// Initialize the application
const factorTree = new FactorTree(); 