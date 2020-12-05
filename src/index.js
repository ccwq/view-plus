import aTable from "./a-table";
import coFrom from "./co-form"
export default {
    install(Vue, options={}){
        const {} = options;
        debugger;
        Vue.mixin({
            components:{
                coFrom,
                aTable,
            },
        })
    }
}