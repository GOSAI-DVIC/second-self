//VN ENGINE SCRIPT by SmexGames
// targeted_signs contient les signes à reproduire sur le moment
// la value de chacun est son count de validation

export class Engine {
    constructor(sketch) {
        this.sketch = sketch;

        this.subSketch = null;
        this.sketch.colorMode(HSL, 360, 1, 1, 1);
        this.progressBar = new ProgressBar(this, width * 0.25, width * 0.75, height * 0.5, height * 0.5);

        this.sign_count_threshold = 5;
        this.currentBackground = null;

        this.endText = "-End of Script-";
        // this.charactersFiles = {};
        this.images = [];
        this.DEBUG = false;
        this.currentBackground = null;
        this.variables = new Object;
        this.gameStarted = false;
        this.ratio;
        this.ratioX = 1;
        this.ratioY = 1;

        this.lastInterraction = Date.now();

        this.ElementTypes = {
            DIALOG: 1,
            IMAGE: 2,
            COMMAND: 3,
            MENU: 4,
        }
        Object.freeze(this.ElementTypes)

        this.CommandTypes = {
            END: 1,
            SHOW: 2,
            HIDE: 3,
            TAG: 4,
            MENU: 5,
        }
        Object.freeze(this.CommandTypes)

        this.TokenTypes = {
            OpenParen: 1,
            CloseParen: 2,
            Comma: 3,
            Identifier: 4,
            QuotedString: 5,
            ColorDefinition: 6,
            Number: 7,
            Keyword: 8,
            LCR: 9,
            Value: 10,
            TrueOrFalse: 9,
        }
        Object.freeze(this.TokenTypes)

        this.Keywords = {
            Color: "color",
            Left: "LEFT",
            Center: "CENTER",
            Right: "RIGHT",
            True: "true",
            False: "false",
        }
        Object.freeze(this.Keywords)
    }


    update() {
        if (Date.now() - this.lastInterraction > 60000) 
        {
            this.subEngine.remove();
            this.reset(); //TODO à remettre à 60000 dans la version finale
        }
        if (!this.gameStarted) return;
        if (this.guessed_sign != undefined)
        {
            if (this.guessed_sign == "ok" && this.count_valid >= this.sign_count_threshold && Date.now() - this.lastInterraction > 4000) {
                this.subSketch.mouseReleased();
                this.guessed_sign = "empty";
            }
        }
        
    }

    update_sign_data(guessed_sign, probability, actions) {
        this.guessed_sign = guessed_sign;
        if (this.guessed_sign == this.previous_guessed_sign) {
            this.count_valid += 1;
        } else {
            this.count_valid = 0;
        }
        this.previous_guessed_sign = this.guessed_sign;
        this.sign_prob = probability;
        this.actions = actions;

    }

    update_pose_data(results) {
        this.right_hand_pose = results.right_hand_pose;
        this.left_hand_pose = results.left_hand_pose;
        this.body_pose = results.body_pose;
    }

    reset() {
        this.totalElementsLoaded = 0;

        this.progressBar.reset();
        document.querySelectorAll('video').forEach(e => e.remove());

        this.processedScript = []
        this.currentIndex = 0
        this.characters = []
        this.tags = []
        this.menus = []

        this.guessed_sign = "empty";
        this.previous_guessed_sign = null;
        this.count_valid = 0;
        this.sign_prob = 0;

        this.charactersLoadedCount = 0;

        this.cl_mouseWasPressed = false;
        this.cl_lastHovered = null;
        this.cl_lastClicked = null;
        this.cl_clickables = [];

        this.canAdvance = true
        this.enableGUI = true
        this.enableText = true
        this.state = 0;
        this.variables = new Object
        this.gameStarted = false

        this.initCharArray()
        this.processInputFile()
    }

    stop() {
        if (this.gameStarted) {
            this.clearAllAnimations();
            this.clearAllSprites();
            this.subSketch.remove();

            document.querySelectorAll('video').forEach(e => e.remove());
            
            this.sketch.emit("core-app_manager-stop_application", {
                "application_name": "sign_game"
            });
            this.gameStarted = false;
            this.sketch.emit("core-app_manager-start_application", {
                "application_name": "clock"
            });
        }
    }

    initCharArray() {
        this.characters = []
        this.images = []
    }

    // Walk through the process script and create an array of the characters that were defined
    loadAllCharacters() {
        for (var i = 0; i < this.processedScript.length - 1; i++) {
            if (this.processedScript[i].type == this.ElementTypes.DIALOG) {
                if (!this.isCharacterDefined(this.processedScript[i].characterName)) {
                    var c = new Character(this, this.processedScript[i].characterName);
                    this.characters.push(c)
                }
            }
        }
    }

    isCharacterDefined(name) {
        for (let char of this.characters) {
            if (char.name === name) {
                return true;
            }
        }
        return false;
    }

    jump(tagName) {
        var jmpTag = this.getTagByName(tagName);
        this.currentIndex = jmpTag[1];
    }

    handleMenuClick(menuName, item) { //TODO: à appeler quand on réalise un signe
        var menu = this.getMenuByName(menuName);
        menu.handleClick(item);
    }

    handleMenuHover(menuName, item) {
        var menu = this.getMenuByName(menuName);
        menu.handleHover(item);

    }

    handleMenuOutside(menuName, item) {
        var menu = this.getMenuByName(menuName);
        menu.handleOutside(item);
    }

    // modified from https://stackoverflow.com/questions/4434076/best-way-to-alphanumeric-check-in-javascript
    isAlphaAt(str, i) {
        var code = str.charCodeAt(i);
        if (!(code > 64 && code < 91) && // upper alpha (A-Z)
            !(code > 96 && code < 123)) { // lower alpha (a-z)
            return false
        }
        return true
    }

    isAlphaOrDigitAt(str, i) {
        if (this.isAlphaAt(str, i) || this.isDigitAt(str, i))
            return true
    }

    isDigitAt(str, i) {
        var code = str.charCodeAt(i);
        if (code > 47 && code < 58) // numeric
        {
            return true
        }
        return false
    }

    consumeKeyword(line, i, keyword, prefixLen) {
        var start = i;
        if (keyword == "color") {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.Number, line, i)
            i += res[0]
            var num1 = res[1]
            i += this.requireToken(this.TokenTypes.Comma, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.Number, line, i)
            i += res[0]
            var num2 = res[1]
            i += this.requireToken(this.TokenTypes.Comma, line, i)
            res = this.requireTokenAndValue(this.TokenTypes.Number, line, i)
            i += res[0]
            var num3 = res[1]
            i += this.requireToken(this.TokenTypes.CloseParen, line, i)
            return [this.TokenTypes.ColorDefinition, prefixLen + i - start, this.sketch.color(num1, num2, num3)]
        } else if (keyword == "LEFT" || keyword == "RIGHT" || keyword == "CENTER")
            return [this.TokenTypes.LCR, prefixLen + i - start, keyword]
        else if (keyword == "true" || keyword == "false")
            return [this.TokenTypes.TrueOrFalse, prefixLen + i - start, keyword]
    }

    consumeToken(line, index) {
        var start = index
        while (line[index] == ' ' || line[index != '\t']) {
            index++
        }
        if (line[index] == "(")
            return [this.TokenTypes.OpenParen, index - start + 1]

        if (line[index] == ")")
            return [this.TokenTypes.CloseParen, index - start + 1]
        if (line[index] == "\"") {
            var qs = ""
            var count = 1
            while (line[index + count] != "\"") {
                qs += line[index + count]
                count++
            }
            return [this.TokenTypes.QuotedString, index - start + count + 1, qs]
        }
        if (line[index] == ",")
            return [this.TokenTypes.Comma, index - start + 1]
        if (this.isDigitAt(line, index)) {
            var num = parseInt(line[index])
            var count = 1
            while (this.isDigitAt(line, index + count)) {
                num *= 10;
                num += parseInt(line[index + count])
                count++
            }
            return [this.TokenTypes.Number, index - start + count, num]
        }
        let id = "";
        if (this.isAlphaAt(line, index)) {
            id += line[index]
            var count = 1
            while (this.isAlphaOrDigitAt(line, index + count)) {
                id += line[index + count]
                count++
            }

            if (Object.values(this.Keywords).includes(id)) {
                return this.consumeKeyword(line, index + count, id, index - start + count)
            }

            return [this.TokenTypes.Identifier, index - start + count, id]
        }

        throw "Unknown token at index " + index + " of line " + line
    }

    requireToken(type, line, index) {
        var tokenResult = this.consumeToken(line, index)
        if (tokenResult[0] == type)
            return tokenResult[1]
        throw new Error("Expected token " + type + " but saw " + tokenResult[0] + " at position " + index + " of line " + line + " at index " + this.currentIndex)
    }

    requireTokenAndValue(type, line, index) {
        var tokenResult = this.consumeToken(line, index);
        if (tokenResult[0] == type)
            return [tokenResult[1], tokenResult[2]];
        if (type == this.TokenTypes.Value) {
            // this should except numbers or keywords (true, false)
            if (tokenResult[0] == this.TokenTypes.Number) {
                return [tokenResult[1], tokenResult[2]];
            }
            if (tokenResult[0] == this.TokenTypes.TrueOrFalse) {
                return [tokenResult[1], tokenResult[2]];
            }
        }

        throw "Expected token " + type + " but saw " + tokenResult[0] + " at position " + index + " of line " + line;
    }


    parseCharacter(line) {
        var c;
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.QuotedString, line, i)
            i += res[0]
            var id = res[1]

            i += this.requireToken(this.TokenTypes.Comma, line, i)
            res = this.requireTokenAndValue(this.TokenTypes.QuotedString, line, i)
            i += res[0]
            var path = res[1]

            i += this.requireToken(this.TokenTypes.Comma, line, i)
            res = this.requireTokenAndValue(this.TokenTypes.ColorDefinition, line, i)
            i += res[0]
            var color = res[1]

            i += this.requireToken(this.TokenTypes.CloseParen, line, i)

            // the contructor actually places these in an array, as a convenience
            c = new Character(this, id, color, path, this.charactersFiles[id])
            this.characters.push(c)

        }
        this.checkCharactersLoaded(c)
    }

    checkCharactersLoaded(char) {
        (new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(char.areAnimationsLoaded && char.areSpritesLoaded);
            }, 100);
        })).then((loaded) => {
            if (loaded) {
                

                this.charactersLoadedCount++;
                if (this.charactersLoadedCount == Object.keys(this.charactersFiles).length) {

                    this.subEngine = new p5((subSketch) => {
                        this.subSketch = subSketch;
                        this.subSketch.setup = () => {
                            this.subSketch.selfCanvas = this.subSketch
                                .createCanvas(width, height)
                                .position(0, 0)
                                .style("z-index", this.sketch.z_index+1);
                        }

                        this.subSketch.mouseReleased = () => {
                            this.lastInterraction = Date.now();
                            if (this.canAdvance) {
                                if (this.currentIndex + 1 >= this.processedScript.length) {
                                    this.currentIndex = 0
                                    this.gameStarted = false
                                    this.subEngine.remove();
                                    this.reset()
                
                                } else {
                                    this.currentIndex++;
                                }
                
                            }
                        }
                    });

                    this.scribble = new Scribble(this.subEngine);
                    this.scribble.bowing = 0;
                    this.scribble.maxOffset = .1;
                    this.scribble.roughness = 10;

                    this.gameStarted = true;

                }
            } else this.checkCharactersLoaded(char);
        });
    }


    parseImage(line) {
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.Identifier, line, i)
            i += res[0]
            var id = res[1]
            i += this.requireToken(this.TokenTypes.Comma, line, i)
            res = this.requireTokenAndValue(this.TokenTypes.QuotedString, line, i)
            i += res[0]
            var path = res[1]
            i += this.requireToken(this.TokenTypes.CloseParen, line, i)

            // the contructor actually places these in an array, as a convenience
            new MyImage(id, path, this)
        }
    }

    parseBG(line) {
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.Identifier, line, i)
            i += res[0]
            var id = res[1]
            i += this.requireToken(this.TokenTypes.CloseParen, line, i)

            this.processedScript.push(new CommandBG(id, this))
        }
    }

    parseShow(line) {
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.QuotedString, line, i)
            i += res[0]
            var id = res[1]
            i += this.requireToken(this.TokenTypes.Comma, line, i)
            res = this.requireTokenAndValue(this.TokenTypes.LCR, line, i)
            i += res[0]
            var pos = res[1]
            i += this.requireToken(this.TokenTypes.CloseParen, line, i)

            this.processedScript.push(new CommandShow(id, pos, this))
        }
    }

    parseTag(line) {
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.Identifier, line, i)
            i += res[0]
            var id = res[1]
            i += this.requireToken(this.TokenTypes.CloseParen, line, i)
            new CommandTag(id, this)
        }
    }


    parseHide(line) {
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.QuotedString, line, i)
            i += res[0]
            var id = res[1]
            i += this.requireToken(this.TokenTypes.CloseParen, line, i)

            this.processedScript.push(new CommandHide(id, this))
        }
    }

    parseJump(line) {
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.Identifier, line, i)
            i += res[0]
            var id = res[1]
            i += this.requireToken(this.TokenTypes.CloseParen, line, i)

            this.processedScript.push(new CommandJump(id, this.ElementTypes, this))
        }
    }

    parseMenu(line) {
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)

            var res = this.requireTokenAndValue(this.TokenTypes.QuotedString, line, i)
            i += res[0]
            var charName = res[1]
            i += this.requireToken(this.TokenTypes.Comma, line, i)

            var res = this.requireTokenAndValue(this.TokenTypes.QuotedString, line, i)
            i += res[0]
            var menuName = res[1]
            i += this.requireToken(this.TokenTypes.Comma, line, i)

            var res = this.requireTokenAndValue(this.TokenTypes.Number, line, i)
            i += res[0]
            var menuItems = []
            var paramCount = res[1]
            while (paramCount > 0) {
                var menuItem = []

                i += this.requireToken(this.TokenTypes.Comma, line, i)

                var res = this.requireTokenAndValue(this.TokenTypes.QuotedString, line, i)
                i += res[0]
                menuItem.push(res[1])

                i += this.requireToken(this.TokenTypes.Comma, line, i)

                var res = this.requireTokenAndValue(this.TokenTypes.Identifier, line, i)
                i += res[0]
                menuItem.push(res[1])

                menuItems.push(menuItem)
                paramCount--
            }
            i += this.requireToken(this.TokenTypes.CloseParen, line, i)

            this.processedScript.push(new CommandMenu(charName, menuName, menuItems, this))
        }
    }

    parseVariable(line) {
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.Identifier, line, i)
            i += res[0]
            var id = res[1]
            i += this.requireToken(this.TokenTypes.Comma, line, i)
            res = this.requireTokenAndValue(this.TokenTypes.Value, line, i)
            i += res[0]
            var val = res[1]
            i += this.requireToken(this.TokenTypes.CloseParen, line, i)
        }

        this.processedScript.push(new CommandVariable(id, val, this))
    }

    parseConditional(line) {
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.Identifier, line, i)
            i += res[0]
            var variableName = res[1]
            i += this.requireToken(this.TokenTypes.Comma, line, i)
            res = this.requireTokenAndValue(this.TokenTypes.Value, line, i)
            i += res[0]
            var value = res[1]
            i += this.requireToken(this.TokenTypes.Comma, line, i)
            res = this.requireTokenAndValue(this.TokenTypes.Identifier, line, i)
            i += res[0]
            var trueTag = res[1]
            i += this.requireToken(this.TokenTypes.Comma, line, i)
            res = this.requireTokenAndValue(this.TokenTypes.Identifier, line, i)
            i += res[0]
            var falseTag = res[1]
            i += this.requireToken(this.TokenTypes.CloseParen, line, i)
        }

        this.processedScript.push(new CommandConditional(variableName, value, trueTag, falseTag, this))
    }

    parseSetSprite(line) {
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.QuotedString, line, i)
            i += res[0]
            var id = res[1]
            i += this.requireToken(this.TokenTypes.Comma, line, i)
            res = this.requireTokenAndValue(this.TokenTypes.QuotedString, line, i)
            i += res[0]
            var val = res[1]
            i += this.requireToken(this.TokenTypes.CloseParen, line, i)
        }
        this.processedScript.push(new CommandSetSprite(id, val, this))
    }

    parseAddAnimation(line) {
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.QuotedString, line, i)
            i += res[0]
            var id = res[1]
            i += this.requireToken(this.TokenTypes.Comma, line, i)
            res = this.requireTokenAndValue(this.TokenTypes.QuotedString, line, i)
            i += res[0]
            var val = res[1]
            i += this.requireToken(this.TokenTypes.CloseParen, line, i)
        }
        this.processedScript.push(new CommandAddAnimation(id, val, this))
    }


    //create processedScript which is an array of ScriptElement objects
    processInputFile() {
        for (var line in this.sketch.inputFile) {
            if (this.sketch.inputFile[line].startsWith("#") || this.sketch.inputFile[line].trim().length == 0) {
                // do nothing with comments and empty lines
            } else if (this.sketch.inputFile[line].startsWith("$")) {
                if (this.sketch.inputFile[line].startsWith("$defineC")) {
                    this.parseCharacter(this.sketch.inputFile[line].substring(8))
                } else if (this.sketch.inputFile[line].startsWith("$defineImg")) {
                    this.parseImage(this.sketch.inputFile[line].substring(10))
                } else if (this.sketch.inputFile[line].startsWith("$bg")) {
                    this.parseBG(this.sketch.inputFile[line].substring(3))
                } else if (this.sketch.inputFile[line].startsWith("$show")) {
                    this.parseShow(this.sketch.inputFile[line].substring(5))
                } else if (this.sketch.inputFile[line].startsWith("$hide")) {
                    this.parseHide(this.sketch.inputFile[line].substring(5))
                } else if (this.sketch.inputFile[line].startsWith("$tag")) {
                    this.parseTag(this.sketch.inputFile[line].substring(4))
                } else if (this.sketch.inputFile[line].startsWith("$jump")) {
                    this.parseJump(this.sketch.inputFile[line].substring(5))
                } else if (this.sketch.inputFile[line].startsWith("$menu")) {
                    this.parseMenu(this.sketch.inputFile[line].substring(5))
                } else if (this.sketch.inputFile[line].startsWith("$setVar")) {
                    this.parseVariable(this.sketch.inputFile[line].substring(7))
                } else if (this.sketch.inputFile[line].startsWith("$if")) {
                    this.parseConditional(this.sketch.inputFile[line].substring(3))
                } else if (this.sketch.inputFile[line].startsWith("$setSprite")) {
                    this.parseSetSprite(this.sketch.inputFile[line].substring(10))
                } else if (this.sketch.inputFile[line].startsWith("$addAnimation")) {
                    this.parseAddAnimation(this.sketch.inputFile[line].substring(13));
                }

            } else {
                // anything left is either an empty line, or a character name followed by dialog
                if (this.sketch.inputFile[line].trim() == "END") {
                    this.processedScript.push(new CommandEnd(this))

                } else {

                    let splitRes = split(this.sketch.inputFile[line], ": ")

                    if (splitRes[1]) {
                        var cmd = split(splitRes[1], "&")
                        if (!cmd[1]) {
                            this.processedScript.push(new Dialog(this, splitRes[0], splitRes[1], ))
                        } else
                            this.processedScript.push(new Dialog(this, splitRes[0], cmd[0], cmd[1]))
                    } else if (this.sketch.inputFile[line][0] == "&") {}
                }
            }
        }
    }

    getPositionInstructions() {
        if (this.sketch.inputFile[this.currentIndex][1][1]) {
            return
        }
    }

    getCharacterByName(nameString) {
        for (var i = 0; i < this.characters.length; i++) {
            if (this.characters[i].name === nameString) {
                return this.characters[i];
            }
        }
        console.log("Character not found: " + nameString)
        // this should never happen since we preprocess and create all named characters
        return null;
    }


    getMenuByName(nameString) {

        for (var i = 0; i < this.menus.length; i++) {
            if (this.menus[i].menuName === nameString) {
                return this.menus[i];
            }
        }
        // this should never happen since we preprocess and create all named characters
        return null;
    }


    getTagByName(nameString) {

        for (var i = 0; i < this.tags.length; i++) {
            if (this.tags[i][0] === nameString) {
                return this.tags[i];
            }
        }
        // this should never happen since we preprocess and create all named characters
        return null;
    }


    getImageByName(nameString) {
        // if (this.images == undefined) return null
        for (var i = 0; i < this.images.length; i++) {
            if (this.images[i].name === nameString) {
                return this.images[i];
            }
        }
        return null;
    }


    setup(charactersFiles, actions) {
        this.charactersFiles = charactersFiles;
        this.actions = actions;
        this.totalElementsToLoad = 0;
        for (var charName in this.charactersFiles) {
            this.totalElementsToLoad += this.charactersFiles[charName]["sprites"].length;
            this.totalElementsToLoad += this.charactersFiles[charName]["animations"].length;
        }

        this.ratioY = 1;
        this.ratioX = 1;

        this.ratio = this.ratioY;

        this.reset();
    }

    show() {
        this.sketch.clear();
        if (!this.gameStarted) 
        {
            this.sketch.noStroke();
            this.sketch.textSize(48 * this.ratioY);
            this.sketch.fill(255);
            this.sketch.text("Loading...", 18 * width/40 * this.ratioX, 18*height/40 * this.ratioY);
            this.progressBar.pBar.curr = this.progressBar.pBar.x1 + (this.progressBar.pBar.x2 - this.progressBar.pBar.x1)*this.totalElementsLoaded/this.totalElementsToLoad;
            this.progressBar.render();
            return;
        }

        this.subSketch.clear();
        
        // todo vérifier si tout s'est chargé correctement avant d'afficher le GUI et le texte

        if (this.currentBackground != null) {
            this.sketch.imageMode(CORNER);
            this.sketch.image(this.currentBackground, 0, 0, width, height);
        } else {
            this.sketch.background(0)
        }

        this.subSketch.stroke(150, 150, 255, 80) 

        this.drawAllCharacterSprites()
        this.playAllCharacterAnimations()

        if (this.enableGUI) {
            this.renderGUI()
        }
        if (this.enableText) {
            this.renderText()
        }
    }


    renderGUI() {
        this.subSketch.strokeWeight(4 * this.ratio)
        this.scribble.scribbleFilling([2*width/40 * this.ratioX, 2*width/40* this.ratioX, 36*width/40 * this.ratioX, 36*width/40 * this.ratioX], [29*height/40 * this.ratioY, 38*height/40 * this.ratioY, 38*height/40 * this.ratioY, 29*height/40 * this.ratioY], 2, -20)
    }

    renderText() {
        this.subSketch.fill(255)
        this.subSketch.stroke(0)
        this.subSketch.strokeWeight(8 * this.ratio)
        this.subSketch.textFont(this.sketch.font)
        this.subSketch.textAlign(LEFT)

        this.processedScript[this.currentIndex].render()
        
        if (this.processedScript[this.currentIndex].type == this.ElementTypes.COMMAND && this.processedScript[this.currentIndex].commandType != this.CommandTypes.END) {
            this.subSketch.mouseReleased() //* pourquoi celle là avant 754
        }
    }

    drawAllCharacterSprites() {
        for (var i = 0; i < this.characters.length; i++) {
            this.characters[i].drawSprite()
        }

    }

    playAllCharacterAnimations() {
        
        for (var i = 0; i < this.characters.length; i++) {
            this.characters[i].playAnimations()
            
        }
    }

    clearAllSprites() {
        for (var i = 0; i < this.characters.length; i++) {
            this.characters[i].setSprite(0)
            this.characters[i].lastSprite = 0
        }
    }

    clearAllAnimations() {
        for (var i = 0; i < this.characters.length; i++) {
            this.characters[i].currentAnimations = []
            this.characters[i].lastAnimation = undefined;
        }
    }
}

class ScriptElement {
    constructor(type, commandType = null) {
        this.type = type
        this.commandType = commandType
    }
}

class Character {
    constructor(engine, name, charColor = 255, path = [], filesNamesDict = {}, spriteXpos = width / 2, spriteYpos = 15 * height / 40, animationXpos  = width / 2, animationYpos = 2*height/40) {
        this.name = name;
        this.charColor = charColor;
        this.path = path;
        this.spriteXpos = spriteXpos;
        this.spriteYpos = spriteYpos;
        this.animationXpos = animationXpos;
        this.animationYpos = animationYpos;
        this.lastSprite = 0;
        this.originalSpriteWidth = 0;
        this.originalSpriteHeight= 0;
        this.originalAnimationWidth = 0;
        this.originalAnimationHeight = 0;
        this.lastAnimation = undefined;

        this.lastTimeAnimationWasPlayed = -15000;
        this.areSpritesLoaded = false;
        this.areAnimationsLoaded = false;

        this.engine = engine;

        // Chargement des sprites
        this.sprites = {};
        if (path.length) {
            for (let spriteName of filesNamesDict["sprites"]) {
                this.engine.sketch.loadImage(path + "/sprites/" + spriteName, img => {
                    if (img != null) {
                        this.sprites[spriteName.substring(0, spriteName.indexOf("."))] = img;
                        if (Object.keys(this.sprites).length == filesNamesDict["sprites"].length) this.areSpritesLoaded = true;
                        this.originalSpriteWidth = img.width;
                        this.originalSpriteHeight = img.height;
                    }
                    this.engine.totalElementsLoaded++;
                })
            }
        }
        // Chargement des animations
        this.animations = {};
        if (filesNamesDict["animations"].length == 0) this.areAnimationsLoaded = true;
        if (path.length) {
            for (let animationName of filesNamesDict["animations"]) {
                let video = this.engine.sketch.createVideo([path + "/animations/" + animationName], () => {
                    if (video != null) {
                        let videoName = animationName.substring(0, animationName.indexOf("."));
                        video.hide();
                        video.name = videoName;
                        video.isPlayable = true;
                        video.onended(() => {
                            this.animations[videoName].isPlayable = true;
                        });
                        this.animations[videoName] = video;
                        this.originalAnimationWidth = video.width;
                        this.originalAnimationHeight = video.height;
                        if (Object.keys(this.animations).length == filesNamesDict["animations"].length) this.areAnimationsLoaded = true;
                    }
                    this.engine.totalElementsLoaded++;
                });

            }
        }

        this.currentSprite = 0
        // this.currentAnimation = undefined
        this.currentAnimations = []
    }

    setSprite(spriteName) {
        this.currentSprite = spriteName
        if (spriteName != 0) this.stopAnimations();
    }

    addAnimation(name) {
        (new Promise((resolve, reject) => {
            resolve(this.animations[name] != undefined);
        })).then((isAnimAvaible) => {
            if (isAnimAvaible) {
                this.animations[name].isPlayable = true;
                this.currentAnimations.push(this.animations[name]);
                this.currentSprite = 0;
            } else {
                setTimeout(() => {
                    this.addAnimation(name)
                }, 100);
            }
        });
    }

    setSpritePos(pos) {
        if (pos == "LEFT")
            this.spriteXpos = width/2 + 2*this.originalSpriteWidth/40
        else if (pos == "CENTER")
            this.spriteXpos = width/2  + 8*this.originalSpriteWidth/40
        else
            this.spriteXpos = width/2  + 12*this.originalSpriteWidth/40
    }

    setAnimationPos(pos) {
        if (pos == "LEFT")
            if (this.currentAnimations.length < 3)
                this.animationXpos = width/2 - 11*this.originalAnimationWidth/20
            else
                this.animationXpos = width/2 - 12*this.originalAnimationWidth/20
        else if (pos == "CENTER")
            if (this.currentAnimations.length < 3)
                this.animationXpos = width/2 - 17*this.originalAnimationWidth/40
            else
                this.animationXpos = width/2 -17*this.originalAnimationWidth/40
        else {
            if (this.currentAnimations.length < 3)
                this.animationXpos = width/2 - 5*this.originalAnimationWidth/16
            else
                this.animationXpos = width/2 - 5*this.originalAnimationWidth/20
        }
    }

    drawSprite() {
        if (this.path.length) {
            if (this.currentSprite != 0 && this.sprites[this.currentSprite] != null) {
                this.engine.sketch.imageMode(CENTER)
                this.sprites[this.currentSprite].resize(this.originalSpriteWidth * this.engine.ratioX*1.2, this.originalSpriteHeight * this.engine.ratioY*1.2)
                this.engine.sketch.image(this.sprites[this.currentSprite], this.spriteXpos, this.spriteYpos)
            }
        }
    }

    playAnimations() {
        for ( let animIndex = 0; animIndex < this.currentAnimations.length; animIndex++) {
            if (this.path.length && this.currentAnimations[animIndex] != undefined && this.currentSprite == 0) {
                // si la vidéo n'est pas en train de jouer et qu'elle est jouable
                if (this.currentAnimations[animIndex].isPlayable) {
                    //si le menu est affiché, on change l'animation actuelle à celle d'après
                    this.currentAnimations[animIndex].isPlayable = false;
                    this.currentAnimations[animIndex].show();
                    this.currentAnimations[animIndex].volume(0);
                    this.currentAnimations[animIndex].size(this.originalAnimationWidth * this.engine.ratioX*1.2, this.originalAnimationHeight * this.engine.ratioY*1.2);
                    if (this.currentAnimations.length == 2)
                    {
                        if (animIndex == 0) {
                            this.setAnimationPos("LEFT")
                        } else {
                            this.setAnimationPos("RIGHT")
                        }
                    }
                    else if (this.currentAnimations.length == 3)
                    {
                        if (animIndex == 0) {
                            this.setAnimationPos("LEFT")
                            
                        } else if (animIndex == 1){
                            this.setAnimationPos("CENTER")
                        }
                        else {
                            this.setAnimationPos("RIGHT")
                        }
                    }
                    this.currentAnimations[animIndex].position(this.animationXpos, this.animationYpos);

                    this.currentAnimations[animIndex].loop();
                    this.engine.lastTimeAnimationWasPlayed = Date.now();
                }
            }    
        }
        
    }

    stopAnimations() {
        if (this.path.length) {
            this.currentAnimations = [];
            for(let anim in this.animations) {
                this.animations[anim].stop();
                this.animations[anim].hide();
                this.animations[anim].isPlayable = true;
            }
        }
    }
}

class MyImage {
    constructor(name, path, engine) {
        this.name = name
        this.path = path
        engine.sketch.loadImage(path, img => {
            this.p5Image = img
        })
        engine.images.push(this)

        this.currentSprite = 0
    }

    setSprite(i) {
        this.currentSprite = i
    }
}


class CommandTag extends ScriptElement {
    constructor(tagName, engine) {
        super(engine.ElementTypes.COMMAND)
        this.tagName = tagName
        this.lineNumber = engine.processedScript.length
        engine.tags.push([tagName, this.lineNumber])

    }

}

class CommandEnd extends ScriptElement {
    constructor(engine) {
        super(engine.ElementTypes.COMMAND, engine.CommandTypes.END);
        this.engine = engine;
    }

    render() {
        if (this.engine.gameStarted) {
            this.engine.subEngine.remove();
            this.engine.reset()
        }
    }
}

class CommandBG extends ScriptElement {
    constructor(name, engine) {
        super(engine.ElementTypes.COMMAND)
        this.name = name;
        this.engine = engine;
        if (this.name != "none") {
            this.myImage = this.engine.getImageByName(this.name)
        }
    }

    render() {
        console.log("setting background to "+ this.engine.currentBackground)
        if (this.name == "none") {
            this.engine.currentBackground = null
        } else {
            (new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve(this.myImage.p5Image != undefined);
                }, 100);
            })).then((loaded) => {
                if (loaded) {
                    console.log("background set to " + this.myImage.p5Image)
                    this.engine.currentBackground = this.myImage.p5Image;
                }
                else this.render();
            });

        }
    }
}


class CommandShow extends ScriptElement {
    constructor(name, pos, engine) {
        super(engine.ElementTypes.COMMAND)
        this.characterName = name
        this.pos = pos
        this.engine = engine
    }

    render() {
        var char = this.engine.getCharacterByName(this.characterName)
        
        if (Object.keys(char.sprites).length > 0) {
            char.setSpritePos(this.pos)
        }
        if (Object.keys(char.animations).length > 0) {
            char.setAnimationPos(this.pos)
        }

        if (char.lastSprite == 0) {
            char.setSprite(1)
        } else {
            char.setSprite(char.lastSprite)
        };
    }
}

class CommandHide extends ScriptElement {
    constructor(name, engine) {
        super(engine.ElementTypes.COMMAND)
        this.engine = engine;
        this.characterName = name
    }

    render() {
        var char = this.engine.getCharacterByName(this.characterName)
        char.setSprite(0)
        char.stopAnimations();
    }
}


class CommandJump extends ScriptElement {
    constructor(tagName, ElementTypes, engine) {
        super(ElementTypes.COMMAND)
        this.tagName = tagName
        this.engine = engine
    }

    render() {
        this.engine.jump(this.tagName)
    }
}

class CommandVariable extends ScriptElement {
    constructor(Name, ValueToSet, engine) {
        super(engine.ElementTypes.COMMAND)
        this.name = Name
        this.value = ValueToSet
        this.engine = engine

        this.engine.variables[Name] = false // at definition time, we can't set the values, only when walking the processed script can we do that
    }

    render() {
        this.engine.variables[this.name] = this.value
    }
}

class CommandConditional extends ScriptElement {
    constructor(variableName, value, trueTag, falseTag, engine) {
        super(engine.ElementTypes.COMMAND);
        this.variableName = variableName;
        this.value = value;
        this.trueTag = trueTag;
        this.falseTag = falseTag;
        this.engine = engine;
    }

    render() {
        if (this.engine.variables[this.variableName] === "true" || this.engine.variables[this.variableName] == this.value) {
            this.engine.jump(this.trueTag);
            console.log("jumping to true tag");
        } else {
            this.engine.jump(this.falseTag)
            console.log("jumping to false tag");
        }

    }
}

class CommandSetSprite extends ScriptElement { //TODO rajouter la possibilité de set direct ou apparait le sprite
    constructor(charName, spriteIndex, engine) {
        super(engine.ElementTypes.COMMAND)
        this.character = engine.getCharacterByName(charName)
        this.spriteIndex = spriteIndex
    }

    render() {
        this.character.setSprite(this.spriteIndex)
        this.character.lastSprite = this.spriteIndex
    }
}

class CommandAddAnimation extends ScriptElement {
    constructor(charName, animationName, engine) {
        super(engine.ElementTypes.COMMAND)
        this.character = engine.getCharacterByName(charName)
        this.animationName = animationName
    }

    render() {
        this.character.addAnimation(this.animationName);
        this.character.currentAnimations = [];
        this.character.lastAnimation = this.character.animations[this.animationName];
    }
}

class CommandMenu extends ScriptElement {
    constructor(charName, menuName, menuItems, engine) {
        super(engine.ElementTypes.MENU);
        this.engine = engine;
        this.char = this.engine.getCharacterByName(charName)
        this.menuName = menuName;
        this.menuItems = menuItems;
        this.everdrawn = false;
        this.erverRendered = false;
        this.buttons = [];

        if (engine.getMenuByName(menuName) == null) this.engine.menus.push(this);

        
        for (let item of menuItems) {
            if (!this.engine.actions.includes(item[0]))
                throw "Element " + item[0] + " in menu is not a valid action";

        }
    }

    handleClick(item) { //* A appeler lors d'un signe
        console.log("clicking on " + this.menuItems[item][0])
        this.engine.lastInterraction = Date.now();
        this.engine.canAdvance = true
        this.engine.enableGUI = true
        this.char.stopAnimations();
        this.engine.jump(this.menuItems[item][1])
        this.erverRendered = false;
    }

    handleHover(item) { //* Plus utile
        this.engine.subSketch.push()
        this.buttons[item].color = "#FFFFFFC0"
        this.engine.subSketch.pop()
    }

    handleOutside(item) { //* Plus utile
        if (this.buttons.length == 0) return;
        this.engine.subSketch.push()
        this.buttons[item].color = "#FFFFFF80"
        this.engine.subSketch.pop()
    }

    render() {
        if (!this.erverRendered) {
            this.erverRendered = true;
            this.engine.clearAllAnimations();
            this.engine.clearAllSprites();

            for (let i = 0; i < this.menuItems.length; i++) {
                this.char.addAnimation(this.menuItems[i][0]);
            }
            if (this.menuItems.length == 1)
                this.char.setAnimationPos("CENTER");
        }

        this.engine.canAdvance = false;
        this.engine.enableGUI = false;
        if (!this.everdrawn) {
            for (let i = 0; i < this.menuItems.length; i++) {
                this.buttons.push(new Clickable());
                this.buttons[i].locate(width / 2, height / 2);

                this.buttons[i].cornerRadius = 10; //Corner radius of the clickable (float)
                this.buttons[i].strokeWeight = 2; //Stroke width of the clickable (float)
                this.buttons[i].stroke = "#000000"; //Border color of the clickable (hex number as a string)
                this.buttons[i].text = ""; //Text of the clickable (string)
                this.buttons[i].textColor = "#000000"; //Color of the text (hex number as a string)
                this.buttons[i].textSize = 34; //Size of the text (integer)
                this.buttons[i].textFont = "sans-serif"; //Font of the text (string)
                this.buttons[i].textScaled = false; //Whether to scale the text with the clickable (boolean)

                this.buttons[i].locate(width/(2*this.menuItems.length) + i*width/this.menuItems.length - this.buttons[i].width/2, height / 2 + this.buttons[i].height / 2)

                this.buttons[i].width = (width / 2);
                this.buttons[i].height = ((height - 50) / this.menuItems.length) * .50;
                let menuName = this.menuName;

                let engine = this.engine;
                this.buttons[i].onHover = function () {
                    return engine.handleMenuHover(menuName, i);
                }

                this.buttons[i].onOutside = function () {
                    return engine.handleMenuOutside(menuName, i);
                }

                this.buttons[i].onRelease = function () { //* A appeler lors d'un signe
                    return engine.handleMenuClick(menuName, i);
                }
            }
        }
            
        for (let i = 0; i < this.menuItems.length; i++) {
            this.engine.subSketch.push();
            this.buttons[i].draw();
            this.engine.subSketch.pop();

            this.engine.subSketch.push();
            this.engine.subSketch.textAlign(CENTER, CENTER);
            this.engine.subSketch.textSize(34 * this.engine.ratio);
            // on set à x la moitié de l'écran la position de l'avatar
            this.engine.subSketch.text(this.menuItems[i][0],  width/(2*this.menuItems.length) + i*width/this.menuItems.length - this.menuItems[i][0].length/2, 3*height / 4);
            this.engine.subSketch.pop();
        }

        if (this.engine.guessed_sign != undefined)
        {    
            for (let i = 0; i < this.menuItems.length; i++)
            {
                if (this.menuItems[i][0] == this.engine.guessed_sign)
                {
                    if (this.engine.count_valid >= this.engine.sign_count_threshold && Date.now() - this.engine.lastInterraction > 2000) {
                        // this.engine.subSketch.mouseReleased();
                        this.engine.handleMenuClick(this.menuName, i);
                        this.engine.guessed_sign = "empty";
                        this.engine.show();
                    }
                }
            }
        }
    }
}


class Dialog extends ScriptElement {
    constructor(engine, characterName, dialog, command = null) {
        super(engine.ElementTypes.DIALOG);
        this.characterName = characterName;
        this.dialog = dialog;
        this.command = command;
        this.engine = engine;
        this.yGap = 300;

    }

    render() {
        this.engine.subSketch.textAlign(LEFT);
        if (this.characterName != "N") {

            this.engine.subSketch.textSize(38 * this.engine.ratio)
            var char = this.engine.getCharacterByName(this.characterName);
            this.engine.subSketch.fill(char.charColor);
            this.engine.subSketch.text(this.characterName + ":", 3*width/40 * this.engine.ratioX, 60*height/80 * this.engine.ratioY, 65*width/80 * this.engine.ratioX, height/2.3 * this.engine.ratioY);

            if (this.command && this.command.length) {
                if (this.command.includes("LEFT")) {
                    char.setSpritePos("LEFT");
                    char.setAnimationPos("LEFT");
                }
                else if (this.command.includes("RIGHT")) {
                    char.setSpritePos("RIGHT");
                    char.setAnimationPos("RIGHT");
                }
                if (this.command.includes("CENTER")) {
                    char.setSpritePos("CENTER");
                    char.setAnimationPos("CENTER");
                }
            }
        }
        this.engine.subSketch.textSize(32 * this.engine.ratioY);
        this.engine.subSketch.fill(255);
        this.engine.subSketch.text(this.dialog, 3*width/40 * this.engine.ratioX, 63*height/80 * this.engine.ratioY, 65*width/80 * this.engine.ratioX, height - 40);

        if (Date.now() - this.engine.lastInterraction > 4000)
        {
            this.engine.subSketch.textSize(20 * this.engine.ratioY);
            this.engine.subSketch.fill(235, 52, 198);
            this.engine.subSketch.text("(Make the sign \"ok\" to skip the dialogs.)", 3*width/40 * this.engine.ratioX, 75*height/80 * this.engine.ratioY);
        }

        
    }
}

class ProgressBar {
    constructor(engine, _x1, _x2, _y1, _y2) {
        this.x1 = _x1;
        this.x2 = _x2;
        this.y1 = _y1;
        this.y2 = _y2;

        this.engine = engine;
        this.reset();
        
    }
    
    reset() {
        this.pBar = {
            curr: this.x1,
            newCurr: 0,
            x1: this.x1,
            x2: this.x2,
            y1: this.y1,
            y2: this.y2,
            col: 280
        };
    }

    fillBar() {
        this.engine.sketch.stroke(this.pBar.col, 1, 0.8, 1);
        this.engine.sketch.strokeWeight(30);
        this.engine.sketch.line(this.pBar.x1, this.pBar.y1, this.pBar.curr, this.pBar.y2);
  
        return this;
    }
  
    display() {
        this.engine.sketch.stroke(this.pBar.col, 1, 0.75, 0.3);
        this.engine.sketch.strokeWeight(30);
        this.engine.sketch.line(this.pBar.x1, this.pBar.y1, this.pBar.x2, this.pBar.y2);
    
        return this;
    }
  
    render() {
        return this.display().fillBar();
    }
}