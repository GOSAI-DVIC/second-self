export class Engine {
    constructor() {
        //VN ENGINE SCRIPT by SmexGames
        this.inputFile = []
        this.processedScript = []
        this.currentIndex = 0
        this.endText = "-End of Script-"
        this.characters = []
        this.images = []
        this.tags = []
        this.menus = []
        this.canAdvance = true
        this.DEBUG = false
        this.enableGUI = true
        this.enableText = true
        this.state = 0;
        this.currentBackground
        this.variables = new Object
        this.gameStarted = false
        this.ratio;
        this.ratioX
        this.ratioY;

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

    show() {}

    update() {}

    update_sign_data(results) {
        this.right_hand_pose = results.rightHandLandmarks;
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

        cl_mouseWasPressed = false;
        cl_lastHovered = null;
        cl_lastClicked = null;
        cl_clickables = [];

        startButton = new Clickable()
        startButton.onOutside = function () { startButton.color = '#FFFFFF80' }
        startButton.onHover = function () { startButton.color = '#FFFFFFC0' }

        startButton.cornerRadius = 10;       //Corner radius of the clickable (float)
        startButton.strokeWeight = 2;        //Stroke width of the clickable (float)
        startButton.stroke = "#000000";      //Border color of the clickable (hex number as a string)
        startButton.text = "";       //Text of the clickable (string)
        startButton.textColor = "#000000";   //Color of the text (hex number as a string)
        startButton.textSize = 12;           //Size of the text (integer)
        startButton.locate(width / 3, .5 * height)
        startButton.width = (width / 3)
        startButton.height = ((height - 50) / 5)

        startButton.onRelease = function () {
            this.currentIndex = 0
            this.gameStarted = true
        }

        this.canAdvance = true
        this.enableGUI = true
        this.enableText = true
        this.state = 0;
        this.currentBackground
        this.variables = new Object
        this.gameStarted = false
        initCharArray()
        processInputFile()
        loadAllCharacters()
    }

    preload() {
        this.inputFile = loadStrings("script.txt")

        font = loadFont("fonts/PressStart2P.ttf")
        title = loadImage("backgrounds/Titlescreen.png")
        // song = loadSound("song.ogg")
    }

    initCharArray() {
        this.characters = []
        this.images = []
    }

    // Walk through the process script and create an array of the characters that were defined
    loadAllCharacters() {
        for (i = 0; i < this.processedScript.length - 1; i++) {
            if (this.processedScript[i].type == this.ElementTypes.DIALOG) {
                if (!isCharacterDefined(this.processedScript[i].characterName)) {
                    var c = new Character(this.processedScript[i].characterName);
                    this.characters.push(c)
                }
            }
        }
    }

    isCharacterDefined(name) {
        for (var char in this.characters) {
            if (char.name === name) return true
        }
        return false
    }

    jump(tagName) {
        var jmpTag = getTagByName(tagName)
        this.currentIndex = jmpTag[1]
    }

    handleMenuClick(menuName, item) { //TODO: à appeler quand on réalise un signe
        var menu = getMenuByName(menuName)
        menu.handleClick(item)
    }
    
    handleMenuHover(menuName, item) { //* Plus utile
        var menu = getMenuByName(menuName)
        menu.handleHover(item)
    
    }
    
    handleMenuOutside(menuName, item) { //* Plus utile
        var menu = getMenuByName(menuName)
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
        if (isAlphaAt(str, i) || isDigitAt(str, i))
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
            i += requireToken(TokenTypes.OpenParen, line, i)
            var res = requireTokenAndValue(TokenTypes.Number, line, i)
            i += res[0]
            var num1 = res[1]
            i += requireToken(TokenTypes.Comma, line, i)
            var res = requireTokenAndValue(TokenTypes.Number, line, i)
            i += res[0]
            var num2 = res[1]
            i += requireToken(TokenTypes.Comma, line, i)
            res = requireTokenAndValue(TokenTypes.Number, line, i)
            i += res[0]
            var num3 = res[1]
            i += requireToken(TokenTypes.CloseParen, line, i)
            return [TokenTypes.ColorDefinition, prefixLen + i - start, color(num1, num2, num3)]
        }
        else if (keyword == "LEFT" || keyword == "RIGHT" || keyword == "CENTER")
            return [TokenTypes.LCR, prefixLen + i - start, keyword]
        else if (keyword == "true" || keyword == "false")
            return [TokenTypes.TrueOrFalse, prefixLen + i - start, keyword]
    }

    consumeToken(line, index) {
        var start = index
        while (line[index] == ' ' || line[index != '\t']) {
            index++
        }
        if (line[index] == "(")
            return [TokenTypes.OpenParen, index - start + 1]

        if (line[index] == ")")
            return [TokenTypes.CloseParen, index - start + 1]
        if (line[index] == "\"") {
            var qs = ""
            var count = 1
            while (line[index + count] != "\"") {
                qs += line[index + count]
                count++
            }
            return [TokenTypes.QuotedString, index - start + count + 1, qs]
        }
        if (line[index] == ",")
            return [TokenTypes.Comma, index - start + 1]
        if (isDigitAt(line, index)) {
            var num = parseInt(line[index])
            var count = 1
            while (isDigitAt(line, index + count)) {
                num *= 10;
                num += parseInt(line[index + count])
                count++
            }
            return [TokenTypes.Number, index - start + count, num]
        }
        id = "";
        if (isAlphaAt(line, index)) {
            id += line[index]
            var count = 1
            while (isAlphaOrDigitAt(line, index + count)) {
                id += line[index + count]
                count++
            }

            if (Object.values(Keywords).includes(id)) {
                return consumeKeyword(line, index + count, id, index - start + count)
            }

            return [TokenTypes.Identifier, index - start + count, id]
        }
    }

    requireToken(type, line, index) {
        var tokenResult = consumeToken(line, index)
        if (tokenResult[0] == type)
            return tokenResult[1]
        throw "Expected token " + type + " but saw " + tokenResult[0] + " at position " + index + " of line " + line
    }

    requireTokenAndValue(type, line, index) {
        var tokenResult = consumeToken(line, index);
        if (tokenResult[0] == type)
            return [tokenResult[1], tokenResult[2]];
        if (type == TokenTypes.Value) {
            // this should except numbers or keywords (true, false)
            if (tokenResult[0] == TokenTypes.Number) {
                return [tokenResult[1], tokenResult[2]];
            }
            if (tokenResult[0] == TokenTypes.TrueOrFalse) {
                return [tokenResult[1], tokenResult[2]];
            }
        }

        throw "Expected token " + type + " but saw " + tokenResult[0] + " at position " + index + " of line " + line;
    }

    parseCharacter(line) {
        for (var i = 0; i < line.length; i++) {
            i += requireToken(TokenTypes.OpenParen, line, i)
            var res = requireTokenAndValue(TokenTypes.QuotedString, line, i)
            i += res[0]
            var id = res[1]
            i += requireToken(TokenTypes.Comma, line, i)
            res = requireTokenAndValue(TokenTypes.QuotedString, line, i)
            i += res[0]
            var path = res[1]
            i += requireToken(TokenTypes.Comma, line, i)
            res = requireTokenAndValue(TokenTypes.ColorDefinition, line, i)
            i += res[0]
            var color = res[1]
            i += requireToken(TokenTypes.CloseParen, line, i)

            // the contructor actually places these in an array, as a convenience
            new Character(id, color, path)
        }
    }

    parseImage(line) {
        for (var i = 0; i < line.length; i++) {
            i += requireToken(TokenTypes.OpenParen, line, i)
            var res = requireTokenAndValue(TokenTypes.Identifier, line, i)
            i += res[0]
            var id = res[1]
            i += requireToken(TokenTypes.Comma, line, i)
            res = requireTokenAndValue(TokenTypes.QuotedString, line, i)
            i += res[0]
            var path = res[1]
            i += requireToken(TokenTypes.CloseParen, line, i)

            // the contructor actually places these in an array, as a convenience
            new MyImage(id, path)
        }
    }

    parseBG(line) {
        for (var i = 0; i < line.length; i++) {
            i += requireToken(TokenTypes.OpenParen, line, i)
            var res = requireTokenAndValue(TokenTypes.Identifier, line, i)
            i += res[0]
            var id = res[1]
            i += requireToken(TokenTypes.CloseParen, line, i)

            this.processedScript.push(new CommandBG(id))
        }
    }

    parseShow(line) {
        for (var i = 0; i < line.length; i++) {
            i += requireToken(TokenTypes.OpenParen, line, i)
            var res = requireTokenAndValue(TokenTypes.QuotedString, line, i)
            i += res[0]
            var id = res[1]
            i += requireToken(TokenTypes.Comma, line, i)
            res = requireTokenAndValue(TokenTypes.LCR, line, i)
            i += res[0]
            var pos = res[1]
            i += requireToken(TokenTypes.CloseParen, line, i)

            this.processedScript.push(new CommandShow(id, pos))
        }
    }

    parseTag(line) {
        for (var i = 0; i < line.length; i++) {
            i += requireToken(TokenTypes.OpenParen, line, i)
            var res = requireTokenAndValue(TokenTypes.Identifier, line, i)
            i += res[0]
            var id = res[1]
            i += requireToken(TokenTypes.CloseParen, line, i)

            new CommandTag(id, this.processedScript.length)
        }
    }


    parseHide(line) {
        for (var i = 0; i < line.length; i++) {
            i += requireToken(TokenTypes.OpenParen, line, i)
            var res = requireTokenAndValue(TokenTypes.QuotedString, line, i)
            i += res[0]
            var id = res[1]
            i += requireToken(TokenTypes.CloseParen, line, i)

            this.processedScript.push(new CommandHide(id))
        }
    }

    parseJump(line) {
        for (var i = 0; i < line.length; i++) {
            i += requireToken(TokenTypes.OpenParen, line, i)
            var res = requireTokenAndValue(TokenTypes.Identifier, line, i)
            i += res[0]
            var id = res[1]
            i += requireToken(TokenTypes.CloseParen, line, i)

            this.processedScript.push(new CommandJump(id))
        }
    }

    parseMenu(line) {
        for (var i = 0; i < line.length; i++) {
            i += requireToken(TokenTypes.OpenParen, line, i)
            var res = requireTokenAndValue(TokenTypes.QuotedString, line, i)
            i += res[0]
            var menuName = res[1]
            i += requireToken(TokenTypes.Comma, line, i)

            var res = requireTokenAndValue(TokenTypes.Number, line, i)
            i += res[0]
            var menuItems = []
            var paramCount = res[1]
            while (paramCount > 0) {
                var menuItem = []

                i += requireToken(TokenTypes.Comma, line, i)

                var res = requireTokenAndValue(TokenTypes.QuotedString, line, i)
                i += res[0]
                menuItem.push(res[1])

                i += requireToken(TokenTypes.Comma, line, i)

                var res = requireTokenAndValue(TokenTypes.Identifier, line, i)
                i += res[0]
                menuItem.push(res[1])

                menuItems.push(menuItem)
                paramCount--
            }
            i += requireToken(TokenTypes.CloseParen, line, i)

            this.processedScript.push(new CommandMenu(menuName, menuItems))
        }
    }

    parseVariable(line) {
        for (var i = 0; i < line.length; i++) {
            i += requireToken(TokenTypes.OpenParen, line, i)
            var res = requireTokenAndValue(TokenTypes.Identifier, line, i)
            i += res[0]
            var id = res[1]
            i += requireToken(TokenTypes.Comma, line, i)
            res = requireTokenAndValue(TokenTypes.Value, line, i)
            i += res[0]
            var val = res[1]
            i += requireToken(TokenTypes.CloseParen, line, i)
        }

        this.processedScript.push(new CommandVariable(id, val))
    }

    parseConditional(line) {
        for (var i = 0; i < line.length; i++) {
            i += requireToken(TokenTypes.OpenParen, line, i)
            var res = requireTokenAndValue(TokenTypes.Identifier, line, i)
            i += res[0]
            var variableName = res[1]
            i += requireToken(TokenTypes.Comma, line, i)
            res = requireTokenAndValue(TokenTypes.Identifier, line, i)
            i += res[0]
            var trueTag = res[1]
            i += requireToken(TokenTypes.Comma, line, i)
            res = requireTokenAndValue(TokenTypes.Identifier, line, i)
            i += res[0]
            var falseTag = res[1]
            i += requireToken(TokenTypes.CloseParen, line, i)
        }

        this.processedScript.push(new CommandConditional(variableName, trueTag, falseTag))
    }

    parseSetSprite(line) {
        for (var i = 0; i < line.length; i++) {
            i += requireToken(TokenTypes.OpenParen, line, i)
            var res = requireTokenAndValue(TokenTypes.QuotedString, line, i)
            i += res[0]
            var id = res[1]
            i += requireToken(TokenTypes.Comma, line, i)
            res = requireTokenAndValue(TokenTypes.Number, line, i)
            i += res[0]
            var val = res[1]
            i += requireToken(TokenTypes.CloseParen, line, i)
        }

        this.processedScript.push(new CommandSetSprite(id, val))
    }



    //create processedScript which is an array of ScriptElement objects
    processInputFile() {

        for (var line in this.inputFile) {
            if (this.inputFile[line].startsWith("#") || this.inputFile[line].trim().length == 0) {
                // do nothing with comments and empty lines
            }
            else if (this.inputFile[line].startsWith("$")) {
                if (this.inputFile[line].startsWith("$defineC")) {
                    parseCharacter(this.inputFile[line].substring(8))
                }
                else if (this.inputFile[line].startsWith("$defineImg")) {
                    parseImage(this.inputFile[line].substring(10))
                }
                else if (this.inputFile[line].startsWith("$bg")) {
                    parseBG(this.inputFile[line].substring(3))
                }
                else if (this.inputFile[line].startsWith("$show")) {
                    parseShow(this.inputFile[line].substring(5))
                }
                else if (this.inputFile[line].startsWith("$hide")) {
                    parseHide(this.inputFile[line].substring(5))
                }
                else if (this.inputFile[line].startsWith("$tag")) {
                    parseTag(this.inputFile[line].substring(4))
                }
                else if (this.inputFile[line].startsWith("$jump")) {
                    parseJump(this.inputFile[line].substring(5))
                }
                else if (this.inputFile[line].startsWith("$menu")) {
                    parseMenu(this.inputFile[line].substring(5))
                }
                else if (this.inputFile[line].startsWith("$setVar")) {
                    parseVariable(this.inputFile[line].substring(7))
                }

                else if (this.inputFile[line].startsWith("$if")) {
                    parseConditional(this.inputFile[line].substring(3))
                }

                else if (this.inputFile[line].startsWith("$setSprite")) {
                    parseSetSprite(this.inputFile[line].substring(10))
                }

            }
            else {
                // anything left is either an empty line, or a character name followed by dialog
                if (this.inputFile[line].trim() == "END") {
                    this.processedScript.push(new CommandEnd())
                }
                else {

                    let splitRes = split(this.inputFile[line], ": ")

                    if (splitRes[1]) {
                        var cmd = split(splitRes[1], "&")
                        if (!cmd[1])
                            this.processedScript.push(new Dialog(splitRes[0], splitRes[1]))
                        else
                            this.processedScript.push(new Dialog(splitRes[0], cmd[0], cmd[1]))
                    }
                    else if (this.inputFile[line][0] == "&") {
                    }
                }
            }

        }
    }

    getPositionInstructions() {
        if (this.inputFile[this.currentIndex][1][1]) {
            return
        }
    }

    getCharacterByName(nameString) {

        for (i = 0; i <= this.characters.length; i++) {
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

        for (i = 0; i <= this.images.length; i++) {
            if (this.images[i].name === nameString) {
                return this.images[i]
            }
        }
        return null
    }


    setup() {
        createCanvas(min(windowWidth,800), min(windowHeight,600));
        this.ratioY = height/600
        this.ratioX = width/800
    
        this.ratio = this.ratioY;
        
        reset()
        // song.playMode('restart')
        // song.play()

        scribble = new Scribble();
        scribble.bowing = 0
        scribble.maxOffset = .1
        scribble.roughness = 10;
    }

    mouseReleased() {
        if (this.canAdvance) {
            if (this.currentIndex + 1 >= this.processedScript.length) {
                this.currentIndex = 0
                this.gameStarted = false
                reset()

            } else {
                this.currentIndex++

            }

        }
    }

    renderGUI() {
        strokeWeight(4*this.ratio)
        scribble.scribbleFilling([20*this.ratioX, 20*this.ratioX, 780*this.ratioX, 780*this.ratioX], [450*this.ratioY, 590*this.ratioY, 590*this.ratioY, 450*this.ratioY], 2, -20)
    }

    renderText() {
        fill(255)
        stroke(0)
        strokeWeight(8*this.ratio)
        textFont(font)
        textAlign(LEFT)

        this.processedScript[this.currentIndex].render()

        if (this.processedScript[this.currentIndex].type == this.ElementTypes.COMMAND && this.processedScript[this.currentIndex].commandType != CommandTypes.END) {
            mouseReleased()
        }
    }

    draw() {
        if (this.gameStarted) {
            background(220);

            if (this.currentBackground != null) {
                imageMode(CORNER)
                image(this.currentBackground, 0, 0, width, height)
            }
            else {
                background(0)
            }

            stroke(150, 150, 255)

            drawAllCharacterSprites()

            if (this.enableGUI) {
                renderGUI()
            }
            if (this.enableText) {
                renderText()
            }
            
        }

        else {
        
            push()
            imageMode(CORNER)
            image(title, 0, 0, width, height)
            pop()
            push()
            startButton.draw()
            pop()
            push()
            textAlign(CENTER, CENTER)
            rectMode(CENTER)
            fill(255)
            stroke(0)
            strokeWeight(8*this.ratio)
            textFont(font)

            textSize(24*this.ratio)
            text("Start", width / 2, startButton.y + startButton.height / 2)
            pop()
        }

    }

    drawAllCharacterSprites() {
        for (var i = 0; i < this.characters.length; i++) {
            this.characters[i].drawSprite() //TODO: remplacer par la fonction qui lit la vidéo corresepondante
        }

    }

    clearAllSprites() {
        for (var i = 0; i < this.characters.length; i++) {
            this.characters[i].setSprite(0) //TODO: remplacer par la fonction qui clear les videos
            this.characters[i].lastSprite = 0
        }
    }
    
    windowResized() {
    resizeCanvas(min(windowWidth,800), min(windowHeight,600))
    }
}

class ScriptElement {
    constructor(type, commandType = null) {
        this.type = type
        this.commandType = commandType
    }
}

class Character {
    constructor(name, charColor = 255, path = [], xpos = width / 2, ypos = height / 2,) {
        this.name = name
        this.charColor = charColor
        this.path = path
        this.xpos = xpos
        this.ypos = ypos
        this.lastSprite = 0

        this.sprites = []
        if (path.length) {
            for (let i = 1; i <= 10; i++) {
                var suffix = i.toString().padStart(2, '0')
                loadImage(path + "/" + name + suffix + ".png", img => { if (img != null) this.sprites[i] = img })
            } //TODO Faire en sorte que la vidéo soit chargée
        }
        this.characters.push(this)

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
                imageMode(CENTER)
                
                  this.sprites[this.currentSprite].resize(this.sprites[this.currentSprite].width * this.ratioX, this.sprites[this.currentSprite].height * this.ratioY)
                  
                
                image(this.sprites[this.currentSprite], this.xpos, this.ypos)
            }
        }
    }
}

class MyImage {
    constructor(name, path) {
        this.name = name
        this.path = path
        loadImage(path, img => { this.p5Image = img })
        this.images.push(this)

        this.currentSprite = 0
    }

    setSprite(i) {
        this.currentSprite = i
    }
}


class CommandTag extends ScriptElement {
    constructor(tagName, lineNumber) {
        super(this.ElementTypes.COMMAND)
        this.tagName = tagName
        this.lineNumber = lineNumber
        this.tags.push([tagName, lineNumber])

    }
}

class CommandEnd extends ScriptElement {
    constructor() {
        super(this.ElementTypes.COMMAND, CommandTypes.END)
    }

    render() {
        text(this.endText, 40, 460, 540, height - 40)
        

    
    }
}

class CommandBG extends ScriptElement {
    constructor(name) {
        super(this.ElementTypes.COMMAND)
        this.name = name
        if (this.name != "none") {
            this.myImage = getImageByName(name)
        }
    }

    render() {
        if (this.name == "none") {
            this.currentBackground = null
        } else {
            this.currentBackground = this.myImage.p5Image

        }

    }
}


class CommandShow extends ScriptElement {
    constructor(name, pos) {
        super(this.ElementTypes.COMMAND)
        this.characterName = name
        this.pos = pos
    }

    render() {
        var char = getCharacterByName(this.characterName)
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
    constructor(name) {
        super(this.ElementTypes.COMMAND)
        this.characterName = name
    }

    render() {
        var char = getCharacterByName(this.characterName)
        char.setSprite(0)
        // Hide 
    }
}

class CommandJump extends ScriptElement {
    constructor(tagName) {
        super(this.ElementTypes.COMMAND)
        this.tagName = tagName
    }

    render() {
        jump(this.tagName)
    }
}

class CommandVariable extends ScriptElement {
    constructor(Name, ValueToSet) {
        super(this.ElementTypes.COMMAND)
        this.name = Name
        this.value = ValueToSet

        this.variables[Name] = false // at definition time, we can't set the values, only when walking the processed script can we do that
    }

    render() {
        this.variables[this.name] = this.value
    }
}

class CommandConditional extends ScriptElement {
    constructor(variableName, trueTag, falseTag) {
        super(this.ElementTypes.COMMAND)
        this.variableName = variableName
        this.trueTag = trueTag
        this.falseTag = falseTag

    }

    render() {
        if (this.variables[this.variableName] === "true") {
            jump(this.trueTag)
        } else {
            jump(this.falseTag)
        }

    }
}

class CommandSetSprite extends ScriptElement {
    constructor(charName, spriteIndex) {
        super(this.ElementTypes.COMMAND)
        this.character = getCharacterByName(charName)
        this.spriteIndex = spriteIndex
    }

    render() {
        this.character.setSprite(this.spriteIndex)
        this.character.lastSprite = this.spriteIndex
    }
}

class CommandMenu extends ScriptElement {
    constructor(menuName, menuItems, ratio) {
        super(this.ElementTypes.MENU)
        this.menuName = menuName
        this.menuItems = menuItems
        this.everdrawn = false
        this.buttons = []
        this.menus.push(this)
        this.ratio = ratio
    }

    handleClick(item) { //* A appeler lors d'un signe
        this.canAdvance = true
        this.enableGUI = true
        jump(this.menuItems[item][1])
    }

    handleHover(item) { //* Plus utile
        push()
        this.buttons[item].color = "#FFFFFFC0"
        pop()
    }

    handleOutside(item) { //* Plus utile
        push()
        this.buttons[item].color = "#FFFFFF80"
        pop()
    }

    render() {
        this.canAdvance = false
        this.enableGUI = false
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
                this.buttons[i].onHover = function () { //* Plus utile
                    return handleMenuHover(menuName, i);
                }

                this.buttons[i].onOutside = function () { //* Plus utile
                    return handleMenuOutside(menuName, i)
                }

                this.buttons[i].onRelease = function () { //* A appeler lors d'un signe
                    return handleMenuClick(menuName, i)
                }
            }
            this.everdrawn = true
        }
        for (let i = 0; i < this.menuItems.length; i++) {
            push()
            this.buttons[i].draw()
            pop()

            push()
            textAlign(CENTER, CENTER)
            textSize(24*this.ratio)
            text(this.menuItems[i][0], width / 2, 50 + (((height - 50) / this.menuItems.length) * i) + (this.buttons[i].height / 2))
            pop()
        }
    }
}

class Dialog extends ScriptElement {
    constructor(characterName, dialog, command = null, ratio, ratioX, ratioY) {
        super(this.ElementTypes.DIALOG)
        this.characterName = characterName
        this.dialog = dialog
        this.command = command
        this.ratio=ratio
        this.ratioX=ratioX
        this.ratioY=ratioY
    }

    render() {
        textAlign(LEFT)

        if (this.characterName != "N") {

            textSize(24* this.ratio)
            var char = getCharacterByName(this.characterName)
            fill(char.charColor)

            text(this.characterName + ":", 20*ratioX, 420*this.ratioY, width / 2, 460*this.ratioY)

            if (this.command && this.command.length) {
                if (this.command.includes("LEFT"))
                    char.setPos("LEFT")
                else if (this.command.includes("RIGHT"))
                    char.setPos("RIGHT")
                if (this.command.includes("CENTER"))
                    char.setPos("CENTER")
            }
        }
        textSize(20* this.ratioY)
        fill(255)
        text(this.dialog, 40*this.ratioX, 460*this.ratioY, 740*this.ratioX, height - 40)
    }
}





