import aTable from "./a-table";
import coFrom from "./co-form"
export default {
    install(Vue, options={}){
        const {} = options;
        Vue.mixin({
            components:{
                coFrom,
                aTable,
            },
        })
    }
}