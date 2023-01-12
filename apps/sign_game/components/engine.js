export class Engine {
    constructor(sketch) {
        //VN ENGINE SCRIPT by SmexGames
        // this.sketch.inputFile = [];
        this.processedScript = [];
        this.currentIndex = 0;
        this.endText = "-End of Script-";
        this.characters = [];
        this.images = [];
        this.tags = [];
        this.menus = [];
        this.canAdvance = true;
        this.DEBUG = false;
        this.enableGUI = true;
        this.enableText = true;
        this.state = 0;
        this.currentBackground;
        this.variables = new Object;
        this.gameStarted = false;
        this.ratio;
        this.ratioX;
        this.ratioY;

        this.sketch = sketch;

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
        // this.preload();
        // this.setup()
    }

    show() {
        if (this.gameStarted) {
            // this.sketch.background(220);

            if (this.currentBackground != null) {
                this.sketch.imageMode(CORNER)
                this.sketch.image(this.currentBackground, 0, 0, width, height)
            }
            else {
                this.sketch.background(0)
            }

            this.sketch.stroke(150, 150, 255)

            this.drawAllCharacterSprites()

            if (this.enableGUI) {
                this.renderGUI()
            }
            if (this.enableText) {
                this.renderText()
            }
        }
    }

    update() {}

    update_sign_data(results) {
        this.guessed_sign = results.guessed_sign;
        this.probability = results.probability;
        this.actions = results.actions;
    }

    update_pose_data(results) {
        this.right_hand_pose = results.right_hand_pose;
        this.left_hand_pose = results.left_hand_pose;
        this.body_pose = results.body_pose;
    }

    reset() {
        this.processedScript = []
        this.currentIndex = 0
        this.characters = []
        this.tags = []
        this.menus = []

        this.cl_mouseWasPressed = false;
        this.cl_lastHovered = null;
        this.cl_lastClicked = null;
        this.cl_clickables = [];

        this.currentIndex = 0

        this.canAdvance = true
        this.enableGUI = true
        this.enableText = true
        this.state = 0;
        this.currentBackground
        this.variables = new Object
        this.gameStarted = true
        this.initCharArray()
        this.processInputFile()
        this.loadAllCharacters()
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

                    // for (let char of this.characters) {
                    //     console.log(char.name)
                    // }
                    // console.log("\n")
                    var c = new Character(this, this.processedScript[i].characterName);
                    this.characters.push(c)
                }
            }
        }
    }

    isCharacterDefined(name) {
        // for (let char of this.characters) {
        //     console.log(char.name)
        // }
        // console.log("\n")
        for (let char of this.characters) {
            if (char.name === name) {
                // console.log("Character " + name + " is already defined")
                return true
            }
            // else {
            //     console.log("Character " + name + " is not defined in");
            //     console.log(this.characters);
            // }
        }
        return false
    }

    jump(tagName) {
        var jmpTag = this.getTagByName(tagName)
        this.currentIndex = jmpTag[1]
    }

    handleMenuClick(menuName, item) { //TODO: à appeler quand on réalise un signe
        var menu = this.getMenuByName(menuName)
        menu.handleClick(item)
    }
    
    handleMenuHover(menuName, item) { //* Plus utile
        var menu = this.getMenuByName(menuName)
        menu.handleHover(item)
    
    }
    
    handleMenuOutside(menuName, item) { //* Plus utile
        var menu = this.getMenuByName(menuName)
        menu.handleOutside(item)
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
        }
        else if (keyword == "LEFT" || keyword == "RIGHT" || keyword == "CENTER")
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
    }

    requireToken(type, line, index) {
        var tokenResult = this.consumeToken(line, index)
        if (tokenResult[0] == type)
            return tokenResult[1]
        throw "Expected token " + type + " but saw " + tokenResult[0] + " at position " + index + " of line " + line
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

            i += this.requireToken(this.TokenTypes.Comma, line, i)
            res = this.requireTokenAndValue(this.TokenTypes.Number, line, i)
            i += res[0]
            var framesNb = res[1] 

            i += this.requireToken(this.TokenTypes.CloseParen, line, i)

            // the contructor actually places these in an array, as a convenience
            var c = new Character(this, id, color, path, framesNb)
            this.characters.push(c)

        }
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
            new MyImage(id, path, this.images, this.sketch)
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

            new CommandTag(id, this.ElementTypes, this.processedScript.length, this.tags)
        }
    }


    parseHide(line) {
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.QuotedString, line, i)
            i += res[0]
            var id = res[1]
            i += this.requireToken(this.TokenTypes.CloseParen, line, i)

            this.processedScript.push(new CommandHide(id, this.ElementTypes, this.getCharacterByName))
        }
    }

    parseJump(line) {
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.Identifier, line, i)
            i += res[0]
            var id = res[1]
            i += this.requireToken(this.TokenTypes.CloseParen, line, i)

            this.processedScript.push(new CommandJump(id, this.ElementTypes, this.jump))
        }
    }

    parseMenu(line) {
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
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

            this.processedScript.push(new CommandMenu(menuName, menuItems, this))
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

        this.processedScript.push(new CommandVariable(id, val, this.ElementTypes, this.variables))
    }

    parseConditional(line) {
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.Identifier, line, i)
            i += res[0]
            var variableName = res[1]
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

        this.processedScript.push(new CommandConditional(variableName, trueTag, falseTag, this.ElementTypes,  this.jump))
    }

    parseSetSprite(line) {
        for (var i = 0; i < line.length; i++) {
            i += this.requireToken(this.TokenTypes.OpenParen, line, i)
            var res = this.requireTokenAndValue(this.TokenTypes.QuotedString, line, i)
            i += res[0]
            var id = res[1]
            i += this.requireToken(this.TokenTypes.Comma, line, i)
            res = this.requireTokenAndValue(this.TokenTypes.Number, line, i)
            i += res[0]
            var val = res[1]
            i += this.requireToken(this.TokenTypes.CloseParen, line, i)
        }
        this.processedScript.push(new CommandSetSprite(id, val, this))
    }


    //create processedScript which is an array of ScriptElement objects
    processInputFile() {
        for (var line in this.sketch.inputFile) {
            if (this.sketch.inputFile[line].startsWith("#") || this.sketch.inputFile[line].trim().length == 0) {
                // do nothing with comments and empty lines
            }
            else if (this.sketch.inputFile[line].startsWith("$")) {
                if (this.sketch.inputFile[line].startsWith("$defineC")) {
                    this.parseCharacter(this.sketch.inputFile[line].substring(8))
                }
                else if (this.sketch.inputFile[line].startsWith("$defineImg")) {
                    this.parseImage(this.sketch.inputFile[line].substring(10))
                }
                else if (this.sketch.inputFile[line].startsWith("$bg")) {
                    this.parseBG(this.sketch.inputFile[line].substring(3))
                }
                else if (this.sketch.inputFile[line].startsWith("$show")) {
                    this.parseShow(this.sketch.inputFile[line].substring(5))
                }
                else if (this.sketch.inputFile[line].startsWith("$hide")) {
                    this.parseHide(this.sketch.inputFile[line].substring(5))
                }
                else if (this.sketch.inputFile[line].startsWith("$tag")) {
                    this.parseTag(this.sketch.inputFile[line].substring(4))
                }
                else if (this.sketch.inputFile[line].startsWith("$jump")) {
                    this.parseJump(this.sketch.inputFile[line].substring(5))
                }
                else if (this.sketch.inputFile[line].startsWith("$menu")) {
                    this.parseMenu(this.sketch.inputFile[line].substring(5))
                }
                else if (this.sketch.inputFile[line].startsWith("$setVar")) {
                    this.parseVariable(this.sketch.inputFile[line].substring(7))
                }

                else if (this.sketch.inputFile[line].startsWith("$if")) {
                    this.parseConditional(this.sketch.inputFile[line].substring(3))
                }

                else if (this.sketch.inputFile[line].startsWith("$setSprite")) {
                    this.parseSetSprite(this.sketch.inputFile[line].substring(10))
                }

            }
            else {
                // anything left is either an empty line, or a character name followed by dialog
                if (this.sketch.inputFile[line].trim() == "END") {
                    this.processedScript.push(new CommandEnd(this.ElementTypes, this.CommandTypes, this.endText))
                }
                else {

                    let splitRes = split(this.sketch.inputFile[line], ": ")

                    if (splitRes[1]) {
                        var cmd = split(splitRes[1], "&")
                        if (!cmd[1])
                        {
                            this.processedScript.push(new Dialog(this, splitRes[0], splitRes[1], ))
                        }
                        else
                            this.processedScript.push(new Dialog(this, splitRes[0], cmd[0], cmd[1]))
                    }
                    else if (this.sketch.inputFile[line][0] == "&") {
                    }
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
        for (var i = 0; i <= this.characters.length; i++) {
            if (this.characters[i].name === nameString) {
                return this.characters[i]
            }
        }
        // this should never happen since we preprocess and create all named characters
        return null
    }


    getMenuByName(nameString) {

        for (i = 0; i <= this.menus.length; i++) {
            if (this.menus[i].menuName === nameString) {
                return this.menus[i]
            }
        }
        // this should never happen since we preprocess and create all named characters
        return null
    }


    getTagByName(nameString) {

        for (i = 0; i <= this.tags.length; i++) {
            if (this.tags[i][0] === nameString) {
                return this.tags[i]
            }
        }
        // this should never happen since we preprocess and create all named characters
        return null
    }


    getImageByName(nameString) {
        // if (this.images == undefined) return null
        for (var i = 0; i <= this.images.length; i++) {
            if (this.images[i].name === nameString) {
                return this.images[i]
            }
        }
        return null
    }


    setup() {
        // this.sketch.createCanvas(this.sketch.min(this.sketch.windowWidth,800), this.sketch.min(this.sketch.windowHeight,600));
        // this.ratioY = this.sketch.min(this.sketch.windowHeight)/height;
        // this.ratioX = this.sketch.min(this.sketch.windowWidth)/width;
        // this.ratioY = height/600
        // this.ratioX = width/800
        // console.log(this.ratioX, this.ratioY)
        this.ratioY = 1;
        this.ratioX = 1;
    
        this.ratio = this.ratioY;
        
        this.reset();
        // song.playMode('restart')
        // song.play()
        this.scribble = new Scribble();
        this.scribble.bowing = 0;
        this.scribble.maxOffset = .1;
        this.scribble.roughness = 10;
    }

    mouseReleased() {
        if (this.canAdvance) {
            if (this.currentIndex + 1 >= this.processedScript.length) {
                this.currentIndex = 0
                this.gameStarted = false
                this.reset()

            } else {
                this.currentIndex++
            }

        }
    }

    renderGUI() {
        this.sketch.strokeWeight(4*this.ratio)
        this.scribble.scribbleFilling([20*this.ratioX, 20*this.ratioX, 780*this.ratioX, 780*this.ratioX], [450*this.ratioY, 590*this.ratioY, 590*this.ratioY, 450*this.ratioY], 2, -20)
    }

    renderText() {
        this.sketch.fill(255)
        this.sketch.stroke(0)
        this.sketch.strokeWeight(8*this.ratio)
        this.sketch.textFont(this.sketch.font)
        this.sketch.textAlign(LEFT)

        this.processedScript[this.currentIndex].render()
        if (this.processedScript[this.currentIndex].type == this.ElementTypes.COMMAND && this.processedScript[this.currentIndex].commandType != this.CommandTypes.END) {
            this.mouseReleased()
        }
    }

    drawAllCharacterSprites() {
        for (var i = 0; i < this.characters.length; i++) {
            this.characters[i].drawSprite() 
        }

    }

    clearAllSprites() {
        for (var i = 0; i < this.characters.length; i++) {
            this.characters[i].setSprite(0) //TODO: remplacer par la fonction qui clear les videos
            this.characters[i].lastSprite = 0
        }
    }

    windowResized() {
        // console.log(this.sketch.windowWidth, this.sketch.windowHeight)
        this.sketch.resizeCanvas(this.sketch.min(this.sketch.windowWidth, 800), this.sketch.min(this.sketch.windowHeight, 600))
        // this.sketch.resizeCanvas(this.sketch.min(this.sketch.windowWidth, width), this.sketch.min(this.sketch.windowHeight, height))
        // this.sketch.resizeCanvas(width, height)
    }
}

class ScriptElement {
    constructor(type, commandType = null) {
        this.type = type
        this.commandType = commandType
    }
}

class Character {
    constructor(engine, name, charColor = 255, path = [], framesNb = 10, xpos = width / 2, ypos = height / 2) {
        this.name = name
        this.charColor = charColor
        this.path = path
        this.xpos = xpos
        this.ypos = ypos
        this.lastSprite = 0
        this.engine = engine

        this.sprites = []
        if (path.length) {
            for (let i = 1; i <= framesNb; i++) {
                var suffix = i.toString().padStart(2, '0')  
                // console.log("loading image at " + path + "/" + name + suffix + ".png")
                this.engine.sketch.loadImage(path + "/" + name + suffix + ".png", img => { 
                    if (img != null) {
                        this.sprites[i] = img;
                    }
                })

            } //TODO Faire en sorte que la vidéo soit chargée
        }
        // this.engine.characters.push(this)

        this.currentSprite = 0
    }

    setSprite(i) {
        this.currentSprite = i
    }

    setPos(pos) {
        var quarter = width / 4
        if (pos == "LEFT")
            this.xpos = quarter
        else if (pos == "CENTER")
            this.xpos = quarter * 2
        else
            this.xpos = quarter * 3
    }

    drawSprite() { //TODO Ajouter une fonction pour la lecture de vidéo
        if (this.path.length) {
            if (this.currentSprite != 0 && this.sprites[this.currentSprite] != null) {
                this.engine.sketch.imageMode(CENTER)
                this.sprites[this.currentSprite].resize(this.sprites[this.currentSprite].width * this.engine.ratioX, this.sprites[this.currentSprite].height * this.engine.ratioY)
                this.engine.sketch.image(this.sprites[this.currentSprite], this.xpos, this.ypos)
            }
        }
    }
}

class MyImage {
    constructor(name, path, images, sketch) {
        this.name = name
        this.path = path
        sketch.loadImage(path, img => { this.p5Image = img })
        images.push(this)

        this.currentSprite = 0
    }

    setSprite(i) {
        this.currentSprite = i
    }
}


class CommandTag extends ScriptElement {
    constructor(tagName, ElementTypes,  lineNumber, tags) {
        super(ElementTypes.COMMAND)
        this.tagName = tagName
        this.lineNumber = lineNumber
        tags.push([tagName, lineNumber])

    }

}

class CommandEnd extends ScriptElement {
    constructor(ElementTypes, CommandTypes, endText) {
        super(ElementTypes.COMMAND, CommandTypes.END);
        this.endText = endText;
    }

    render() {
        text(this.endText, 40, 460, 540, height - 40)
    }
}

class CommandBG extends ScriptElement {
    constructor(name, engine) {
        super(engine.ElementTypes.COMMAND)
        this.name = name;
        this.engine = engine;
        if (this.name != "none") {
            //TODO check if the image exists
            this.myImage = this.engine.getImageByName(name)
        }
    }

    render() {
        if (this.name == "none") {
            this.engine.currentBackground = null
        } else {
            this.engine.currentBackground = this.myImage.p5Image

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
        char.setPos(this.pos)
        if (char.lastSprite == 0) {
            char.setSprite(1)
        } else {
            char.setSprite(char.lastSprite)
            // show the image at the pos

        }
    }
}

class CommandHide extends ScriptElement {
    constructor(name, ElementTypes, getCharacterByName) {
        super(ElementTypes.COMMAND)
        this.characterName = name
        this.getCharacterByName = getCharacterByName
    }

    render() {
        var char = this.getCharacterByName(this.characterName)
        char.setSprite(0)
        // Hide 
    }
}

class CommandJump extends ScriptElement {
    constructor(tagName, ElementTypes, jump) {
        super(ElementTypes.COMMAND)
        this.tagName = tagName
        this.jump = jump
    }

    render() {
        this.jump(this.tagName)
    }
}

class CommandVariable extends ScriptElement {
    constructor(Name, ValueToSet, ElementTypes, variables) {
        super(ElementTypes.COMMAND)
        this.name = Name
        this.value = ValueToSet

        variables[Name] = false // at definition time, we can't set the values, only when walking the processed script can we do that
    }

    render() {
        variables[this.name] = this.value
    }
}

class CommandConditional extends ScriptElement {
    constructor(variableName, trueTag, falseTag, ElementTypes, jump) {
        super(ElementTypes.COMMAND)
        this.variableName = variableName
        this.trueTag = trueTag
        this.falseTag = falseTag
        this.jump = jump
    }

    render() {
        if (variables[this.variableName] === "true") {
            this.jump(this.trueTag)
        } else {
            this.jump(this.falseTag)
        }

    }
}

class CommandSetSprite extends ScriptElement {
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

class CommandMenu extends ScriptElement {
    constructor(menuName, menuItems, engine) {
        super(engine.ElementTypes.MENU)
        this.menuName = menuName
        this.menuItems = menuItems
        this.everdrawn = false
        this.buttons = []
        this.engine = engine
        engine.menus.push(this)
    }

    handleClick(item) { //* A appeler lors d'un signe
        this.engine.canAdvance = true
        this.engine.enableGUI = true
        this.engine.jump(this.menuItems[item][1])
    }

    handleHover(item) { //* Plus utile
        this.engine.sketch.push()
        this.buttons[item].color = "#FFFFFFC0"
        this.engine.sketch.pop()
    }

    handleOutside(item) { //* Plus utile
        this.engine.sketch.push()
        this.buttons[item].color = "#FFFFFF80"
        this.engine.sketch.pop()
    }

    render() {
        this.engine.canAdvance = false
        this.engine.enableGUI = false
        if (!this.everdrawn) {
            for (let i = 0; i < this.menuItems.length; i++) {
                this.buttons.push(new Clickable())
                this.buttons[i].locate(width / 2, height / 2)

                this.buttons[i].cornerRadius = 10;       //Corner radius of the clickable (float)
                this.buttons[i].strokeWeight = 2;        //Stroke width of the clickable (float)
                this.buttons[i].stroke = "#000000";      //Border color of the clickable (hex number as a string)
                this.buttons[i].text = "";       //Text of the clickable (string)
                this.buttons[i].textColor = "#000000";   //Color of the text (hex number as a string)
                this.buttons[i].textSize = 12;           //Size of the text (integer)
                this.buttons[i].textFont = "sans-serif"; //Font of the text (string)
                this.buttons[i].textScaled = false;       //Whether to scale the text with the clickable (boolean)
                this.buttons[i].locate(width / 4, 50 + (((height - 50) / this.menuItems.length) * i))
                this.buttons[i].width = (width / 2)
                this.buttons[i].height = ((height - 50) / this.menuItems.length) * .50
                let menuName = this.menuName
                // this.buttons[i].onHover = function () { //* Plus utile
                //     return this.engine.handleMenuHover(menuName, i);
                // }

                // this.buttons[i].onOutside = function () { //* Plus utile
                //     return this.engine.handleMenuOutside(menuName, i)
                // }

                this.buttons[i].onRelease = function () { //* A appeler lors d'un signe
                    return this.engine.handleMenuClick(menuName, i)
                }
            }
            this.everdrawn = true
        }
        for (let i = 0; i < this.menuItems.length; i++) {
            this.engine.sketch.push()
            this.buttons[i].draw()
            this.engine.sketch.pop()

            this.engine.sketch.push()
            this.engine.sketch.textAlign(CENTER, CENTER)
            this.engine.sketch.textSize(24*ratio)
            this.engine.sketch.text(this.menuItems[i][0], width / 2, 50 + (((height - 50) / this.menuItems.length) * i) + (this.buttons[i].height / 2))
            this.engine.sketch.pop()
        }
    }
}


class Dialog extends ScriptElement {
    constructor(engine, characterName, dialog, command = null) {
        super(engine.ElementTypes.DIALOG)
        this.characterName = characterName
        this.dialog = dialog
        this.command = command
        this.engine = engine

    }

    render() {
        this.engine.sketch.textAlign(LEFT)

        if (this.characterName != "N") {

            this.engine.sketch.textSize(24* this.engine.ratio)
            var char = this.engine.getCharacterByName(this.characterName)
            fill(char.charColor)

            text(this.characterName + ":", 20*this.engine.ratioX, 420*this.engine.ratioY, width / 2, 460*this.engine.ratioY)

            if (this.command && this.command.length) {
                if (this.command.includes("LEFT"))
                    char.setPos("LEFT")
                else if (this.command.includes("RIGHT"))
                    char.setPos("RIGHT")
                if (this.command.includes("CENTER"))
                    char.setPos("CENTER")
            }
        }
        this.engine.sketch.textSize(20* this.engine.ratioY)
        this.engine.sketch.fill(255)
        this.engine.sketch.text(this.dialog, 40*this.engine.ratioX, 460*this.engine.ratioY, 740*this.engine.ratioX, height - 40)
    }
}