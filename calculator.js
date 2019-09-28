class Calculator {
    constructor() {

    }
    static calculate(string){
        return new MathExpression(string).solve()
    }
}

class MathExpression {
    constructor(expression) {
        this.expression = expression.split(' ').join('').split('³').join('^3').split('²').join('^2');
        this.buildExpressions()
    }
    buildExpressions() {
        this.expressions = []
        let result = MathExpression.findDividers(this.expression)
        if (result.isfunction) {
            this.dividers = []
            this.expression = result.expression
            this.expressions.push(new MathExpression(result.function))
        }
        else {
            this.dividers = result.dividers
            this.expression = result.expression
            let lastdivider
            let currentdivider
            if (this.dividers.length > 0) {
                lastdivider = this.dividers[0]
                this.expressions.push(new MathExpression(this.expression.substring(0, lastdivider)))
            }
            for (let index = 1; index < this.dividers.length; index++) {
                currentdivider = this.dividers[index]
                this.expressions.push(new MathExpression(this.expression.substring(lastdivider + 1, currentdivider)))
                lastdivider = currentdivider
            }
            if (this.dividers.length > 0) {
                lastdivider = this.dividers[this.dividers.length - 1]
                this.expressions.push(new MathExpression(this.expression.substring(lastdivider + 1)))
            }

            if (this.expressions.length == 0) {
                if (this.expression[0] == '(') {
                    this.expression = this.expression.substring(1)
                    for (let index = 0; index < this.dividers.length; index++) {
                        this.dividers[index]--
                    }
                }

                let index = this.expression.length - 1
                if (this.expression[index] == ')' && !this.expression.includes('(')) this.expression = this.expression.substring(0, index)
            }
        }
    }
    static findDividers(expression) {

        let lowest = -1
        let bracketdepth = 0
        let lastisoperator = false
        let lastisbracket = false
        let isoperator = false
        let isnumber = false
        let lastisempty = false
        let lastisepi = false
        let lastisfunction = false
        let isfunction = false
        let functiondepth = 0
        let arr = []

        for (let index = 0; index < expression.length; index++) {
            let char = expression[index];
            let operator = this.isOperator(char)
            isoperator = operator.isOperator
            let isepi = (char == 'e' && (lastisoperator || lastisbracket)) || char == 'π' || (char == 'p' && expression[index + 1] == 'i')
            isnumber = this.numbers.includes(char) || isepi
            isfunction = !isepi && this.functionstring.includes(char)

            //Check bracketdepth
            if (char == '(') {
                bracketdepth++
                if (lastisfunction || functiondepth > 0) functiondepth++
            }
            else if (char == ')') {
                bracketdepth--
                if (functiondepth > 0) functiondepth--
            }


            //Fix only numbers before and after brackets
            if ((isnumber && char == '(' && index != 0) || (lastisbracket && isnumber)) {
                expression = this.insertMultiply(expression, index)
                isoperator = true
                operator.index = 2
                char = '*'
            }
            else if (char == '!') {
                if ((index == 0 || (lastisoperator && !lastisempty))) {
                    isoperator = false
                    char = '_'
                    expression = this.insertEmpty(expression, index)
                }
                else if (!lastisoperator && (!lastisempty || index == expression.length - 1 || this.isOperator(expression[index + 1]).isOperator)) {
                    isoperator = true
                    expression = this.insertEmpty(expression, index + 1)
                }
            }
            else if (((isepi && !lastisoperator && index != 0) || (lastisepi && isnumber))) {
                expression = this.insertMultiply(expression, index)
                isoperator = true
                operator.index = 2
                char = '*'
                isepi = false
            }
            else if (this.roots.includes(char) && (lastisoperator || index == 0)) {
                expression = this.insert(expression, index, '2')
                isoperator = false
                char = '2'
            }
            else if (char == '.' && (lastisoperator || lastisbracket)){
                expression = this.insert(expression, index, '0')
                char = '0'
            }

            //Check if it found a new lowest operator
            if (isoperator) {
                if ((!lastisoperator || (char != '+' && char != '-')) && index != 0) {
                    let priority = this.getOperatorPriority(operator.index) + 10 * bracketdepth
                    if ((lowest == -1 || priority < lowest) && functiondepth == 0) {
                        lowest = priority
                        arr = [index]
                    }
                    else if (priority == lowest) arr.push(index)//Check if index also should be added
                }
            }

            lastisbracket = char == ')'
            lastisoperator = isoperator
            lastisempty = char == '_'
            lastisepi = isepi
            lastisfunction = isfunction
        }
        let res = this.isZeroFunction(expression)

        if (res !== false && arr.length == 0) {
            return { expression: expression, function: expression.substring(res.stop + 1, expression.length - 1), isfunction: true }
        }

        return { expression: expression, dividers: arr, isfunction: false }
    }
    static isOperator(char) {
        let index = this.operators.indexOf(char)
        return { index: index, isOperator: index != -1 }
    }
    static isZeroFunction(string) {
        let func
        let i
        for (let index = 0; index < this.functions.length; index++) {
            func = this.functions[index];
            i = string.indexOf(func)
            if (i == 0) {
                return { function: func, index: i, stop: i + func.length, functionstring: func }
            }

        }
        return false
    }
    static isFunction(string) {
        let func
        let i
        for (let index = 0; index < this.functions.length; index++) {
            func = this.functions[index];
            i = string.indexOf(func)
            if (i != -1) {
                return { function: func, index: i, stop: i + func.length, functionstring: func }
            }

        }
        return false
    }
    static getOperatorPriority(index) {
        return this.operatorpriorities[index]
    }
    static insertMultiply(expression, position) {
        return [expression.slice(0, position), '*', expression.slice(position)].join('');
    }
    static insertEmpty(expression, position) {
        return [expression.slice(0, position), '_', expression.slice(position)].join('');
    }
    static insert(expression, position, char) {
        return [expression.slice(0, position), char, expression.slice(position)].join('');
    }
    static onlyNumbers(expression) {
        let len = expression.length
        for (let index = len; index > -1; index--) {
            let char = expression[index]
            if (index == 0 && char != '+' && char != '-') return false
            else if (!this.numbers.includes(char)) return false
        }
        return true
    }
    solve() {
        let len = this.expressions.length
        if (len != 0) {
            let answers = []
            for (let index = 0; index < len; index++) {
                answers.push(this.expressions[index].solve())
            }
            return MathExpression.solveExpressions(this.expression, this.dividers, answers)
        }
        else {
            return MathExpression.solveExpression(this.expression)
        }
    }
    static solveExpression(expression) {
        //Solving e pi ; all other operators
        switch (expression) {
            case 'π':
            case 'pi': return Math.PI
            case 'e': return Math.E
            case '_': return NaN
            default: return Number(expression)
        }
    }
    static solveExpressions(expression, dividers, answers) {
        //Solve sin acos atan sin cos tan with rad / degree (°); other functions
        let res = answers[0]
        let func = this.isFunction(expression)
        if (func != false && func.index == 0 && dividers.length == 0) {
            switch (func.functionstring) {
                case 'sin': res = Math.sin(res); break;
                case 'cos': res = Math.cos(res); break;
                case 'tan': res = Math.tan(res); break;
                case 'asin': res = Math.asin(res); break;
                case 'acos': res = Math.acos(res); break;
                case 'atan': res = Math.atan(res); break;
                case 'abs': res = Math.abs(res); break;
                case 'log': res = Math.log10(res); break;
                case 'ln': res = Math.log(res); break;
                case 'sqrt': res = Math.sqrt(res); break;
                case 'radians': res = Math.radians(res); break;
                case 'degree': res = Math.degrees(res); break;
                case '~':
                case 'round': res = Math.round(res); break;
                case 'random': res = Math.random(); break;
                case 'fibonacci': res = Math.fibonacci(res);break;
                case 'ceil': res = Math.ceil(res); break;
                case 'floor': res = Math.floor(res);break;
                case 'bintodec': res = parseInt(String(res), 2); break;
                case 'dectobin': res = res.toString(2);break;
                case 'dectohex': res = res.toString(16);break;
            }
        }
        else {
            let len = dividers.length
            for (let index = 0; index < len; index++) {
                let divider = expression[dividers[index]]
                let a = answers[index + 1]
                switch (divider) {
                    case '+': res += a; break;
                    case '-': res -= a; break;
                    case '*': res *= a; break;
                    case '/': res /= a; break;
                    case '!': {
                        if (isNaN(a)) {
                            res = Math.factorial(res)
                        }
                        else{
                            if (a == 0)res = 1
                            else res = 0
                        }
                        break;
                    }
                    case '%':res %= a;break;
                    case '^':res = Math.pow(res,a);break;
                    case '√':
                    case 'v':
                    case '\\':res = Math.pow(a,1 / res);break;
                    case '>':{
                        if (res > a)res = 1
                        else res = 0
                        break;
                    }
                    case '<':{
                        if (res < a)res = 1
                        else res = 0
                        break;
                    }
                    case '=':{
                        if (res == a)res = 1
                        else res = 0
                        break;
                    }
                    case '|':{
                        if (res > 0 || a > 0)res = 1
                        else res = 0
                        break;
                    }
                    case '&':{
                        if (res > 0 && a > 0)res = 1
                        else res = 0
                        break;
                    }
                }

            }
        }
        return res
    }
}
//                                                      \\ = sqrt
MathExpression.operators = ['+', '-', '*', '/', '%', '^', '\\', 'v', '√', '>', '<', '=','|', '&', '!']
MathExpression.operatorpriorities = [0, 0, 1, 1, 2, 3, 3, 0, 0, 0,0,0, 0, 0, 4]
MathExpression.functions = ['asin', 'acos', 'atan', 'sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs', 'radians', 'degree', 'round', 'random', 'fibonacci', '~', 'ceil', 'floor', 'bintodec', 'dectobin', 'dectohex']
MathExpression.functionstring = 'abcdefdgilnopqrst'
MathExpression.numbers = '0123456789.'
MathExpression.roots = 'v\\√'

Math.radians = function (degrees) {
    return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function (radians) {
    return radians * 180 / Math.PI;
};
Math.factorial = function (n) {
    if (typeof Math.factorials[n] != 'undefined')
        return Math.factorials[n];
    if (n < 0) return NaN
    return Infinity
}
Math.fibonacci = function(n){
    if (Math.fibonaccis[n]) return Math.fibonaccis[n];
    if (n <= 1) return 1;
  
  return fibonacci(n - 1) + fibonacci(n - 2);
}
Math.factorials = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600, 6227020800, 87178291200, 1307674368000, 20922789888000, 355687428096000, 6402373705728000, 121645100408832000, 2432902008176640000, 51090942171709440000, 1124000727777607680000, 25852016738884976640000, 620448401733239439360000, 15511210043330985984000000, 403291461126605635584000000, 10888869450418352160768000000, 304888344611713860501504000000, 8841761993739701954543616000000, 265252859812191058636308480000000, 8222838654177922817725562880000000, 263130836933693530167218012160000000, 8683317618811886495518194401280000000, 295232799039604140847618609643520000000, 10333147966386144929666651337523200000000, 371993326789901217467999448150835200000000, 13763753091226345046315979581580902400000000, 523022617466601111760007224100074291200000000, 20397882081197443358640281739902897356800000000, 815915283247897734345611269596115894272000000000, 33452526613163807108170062053440751665152000000000, 1405006117752879898543142606244511569936384000000000, 60415263063373835637355132068513997507264512000000000, 2658271574788448768043625811014615890319638528000000000, 119622220865480194561963161495657715064383733760000000000, 5502622159812088949850305428800254892961651752960000000000, 258623241511168180642964355153611979969197632389120000000000, 12413915592536072670862289047373375038521486354677760000000000, 608281864034267560872252163321295376887552831379210240000000000, 30414093201713378043612608166064768844377641568960512000000000000, 1551118753287382280224243016469303211063259720016986112000000000000, 80658175170943878571660636856403766975289505440883277824000000000000, 4274883284060025564298013753389399649690343788366813724672000000000000, 230843697339241380472092742683027581083278564571807941132288000000000000, 12696403353658275925965100847566516959580321051449436762275840000000000000, 710998587804863451854045647463724949736497978881168458687447040000000000000, 40526919504877216755680601905432322134980384796226602145184481280000000000000, 2350561331282878571829474910515074683828862318181142924420699914240000000000000, 138683118545689835737939019720389406345902876772687432540821294940160000000000000, 8320987112741390144276341183223364380754172606361245952449277696409600000000000000, 507580213877224798800856812176625227226004528988036003099405939480985600000000000000, 31469973260387937525653122354950764088012280797258232192163168247821107200000000000000, 1982608315404440064116146708361898137544773690227268628106279599612729753600000000000000, 126886932185884164103433389335161480802865516174545192198801894375214704230400000000000000, 8247650592082470666723170306785496252186258551345437492922123134388955774976000000000000000, 544344939077443064003729240247842752644293064388798874532860126869671081148416000000000000000, 36471110918188685288249859096605464427167635314049524593701628500267962436943872000000000000000, 2480035542436830599600990418569171581047399201355367672371710738018221445712183296000000000000000, 171122452428141311372468338881272839092270544893520369393648040923257279754140647424000000000000000, 11978571669969891796072783721689098736458938142546425857555362864628009582789845319680000000000000000, 850478588567862317521167644239926010288584608120796235886430763388588680378079017697280000000000000000, 61234458376886086861524070385274672740778091784697328983823014963978384987221689274204160000000000000000, 4470115461512684340891257138125051110076800700282905015819080092370422104067183317016903680000000000000000, 330788544151938641225953028221253782145683251820934971170611926835411235700971565459250872320000000000000000, 24809140811395398091946477116594033660926243886570122837795894512655842677572867409443815424000000000000000000, 1885494701666050254987932260861146558230394535379329335672487982961844043495537923117729972224000000000000000000, 145183092028285869634070784086308284983740379224208358846781574688061991349156420080065207861248000000000000000000, 11324281178206297831457521158732046228731749579488251990048962825668835325234200766245086213177344000000000000000000, 894618213078297528685144171539831652069808216779571907213868063227837990693501860533361810841010176000000000000000000, 71569457046263802294811533723186532165584657342365752577109445058227039255480148842668944867280814080000000000000000000, 5797126020747367985879734231578109105412357244731625958745865049716390179693892056256184534249745940480000000000000000000, 475364333701284174842138206989404946643813294067993328617160934076743994734899148613007131808479167119360000000000000000000, 39455239697206586511897471180120610571436503407643446275224357528369751562996629334879591940103770870906880000000000000000000, 3314240134565353266999387579130131288000666286242049487118846032383059131291716864129885722968716753156177920000000000000000000, 281710411438055027694947944226061159480056634330574206405101912752560026159795933451040286452340924018275123200000000000000000000, 24227095383672732381765523203441259715284870552429381750838764496720162249742450276789464634901319465571660595200000000000000000000, 2107757298379527717213600518699389595229783738061356212322972511214654115727593174080683423236414793504734471782400000000000000000000, 185482642257398439114796845645546284380220968949399346684421580986889562184028199319100141244804501828416633516851200000000000000000000, 16507955160908461081216919262453619309839666236496541854913520707833171034378509739399912570787600662729080382999756800000000000000000000, 1485715964481761497309522733620825737885569961284688766942216863704985393094065876545992131370884059645617234469978112000000000000000000000, 135200152767840296255166568759495142147586866476906677791741734597153670771559994765685283954750449427751168336768008192000000000000000000000, 12438414054641307255475324325873553077577991715875414356840239582938137710983519518443046123837041347353107486982656753664000000000000000000000, 1156772507081641574759205162306240436214753229576413535186142281213246807121467315215203289516844845303838996289387078090752000000000000000000000, 108736615665674308027365285256786601004186803580182872307497374434045199869417927630229109214583415458560865651202385340530688000000000000000000000, 10329978488239059262599702099394727095397746340117372869212250571234293987594703124871765375385424468563282236864226607350415360000000000000000000000, 991677934870949689209571401541893801158183648651267795444376054838492222809091499987689476037000748982075094738965754305639874560000000000000000000000, 96192759682482119853328425949563698712343813919172976158104477319333745612481875498805879175589072651261284189679678167647067832320000000000000000000000, 9426890448883247745626185743057242473809693764078951663494238777294707070023223798882976159207729119823605850588608460429412647567360000000000000000000000, 933262154439441526816992388562667004907159682643816214685929638952175999932299156089414639761565182862536979208272237582511852109168640000000000000000000000, 93326215443944152681699238856266700490715968264381621468592963895217599993229915608941463976156518286253697920827223758251185210916864000000000000000000000000]
Math.fibonaccis = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811, 514229, 832040, 1346269, 2178309, 3524578, 5702887, 9227465, 14930352, 24157817, 39088169, 63245986, 102334155, 165580141, 267914296, 433494437, 701408733, 1134903170, 1836311903, 2971215073, 4807526976, 7778742049, 12586269025, 20365011074, 32951280099, 53316291173, 86267571272, 139583862445, 225851433717, 365435296162, 591286729879, 956722026041, 1548008755920, 2504730781961, 4052739537881, 6557470319842, 10610209857723, 17167680177565, 27777890035288, 44945570212853, 72723460248141, 117669030460994, 190392490709135, 308061521170129, 498454011879264, 806515533049393, 1304969544928657, 2111485077978050, 3416454622906707, 5527939700884757, 8944394323791464, 14472334024676221, 23416728348467685, 37889062373143906, 61305790721611591, 99194853094755497, 160500643816367088, 259695496911122585, 420196140727489673, 679891637638612258, 1100087778366101931, 1779979416004714189, 2880067194370816120, 4660046610375530309, 7540113804746346429, 12200160415121876738, 19740274219868223167, 31940434634990099905, 51680708854858323072, 83621143489848422977, 135301852344706746049, 218922995834555169026, 354224848179261915075]
