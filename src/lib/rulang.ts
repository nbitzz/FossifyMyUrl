// this code kinda sucks but idrc

export interface Environment {
    Constants: {[key:string]:any},
    Functions: {[key:string]:(...a:any[]) => void}
}

export interface ValueType {
    start:string,
    end:string,
    processor:(str:string,env:Environment) => any 
}

export let ValueTypes:ValueType[] = [
    // string
    {
        start:'\'',
        end:'\'',
        processor: (str,env) => {
            return str
        }
    },
    // env
    {
        start:'[',
        end:']',
        processor: (str,env) => {
            return env.Constants[str]
        }
    },
    // bool
    {
        start:'(',
        end:')',
        processor: (str,env) => {
            let a = ValueProcessor(str.split("|")[0],env)
            let b = ValueProcessor(str.split("|")[2],env)
            switch(str.split("|")[1]) {
                case "==":
                    return a == b;
                    break
                case "!=":
                    return a != b;
                    break
                default:
                    if (!b) {
                        return !!a
                    }
            }
        }
    }
]

export function ValueProcessor(untrimmed_value:string,env:Environment) {
    let ret
    if (untrimmed_value) {
        let value = untrimmed_value.trim()
        ValueTypes.forEach((v) => {
            if (value.startsWith(v.start) && value.endsWith(v.end)) {
                ret = v.processor(value.slice(v.start.length,-v.end.length),env)
            }
        })
    }
    return ret
}

export function FunProcessor(val:string,env:Environment) {
    let value = val.trim()
    let m = value.split(" ")
    let fun = m.splice(0,1)[0]
    let args = m.join(" ").split(",")

    if (env.Functions[fun]) {
        env.Functions[fun](...(args.map(e => ValueProcessor(e,env))))
    } 
}

export default function evaluate(rule:string,env:Environment) {
    // bad way of doing this but i just want to finish this up :/
    let sets = rule.split(">>>")
    let fun = sets.length > 1 ? sets[1] : sets[0]
    let ifs = sets.length > 1 ? sets[0] : undefined

    // if if statement, run it, if not, just run the func

    if (ifs) {
        if (ValueProcessor(ifs,env)) {FunProcessor(fun,env)}
    } else {FunProcessor(fun,env)}
}