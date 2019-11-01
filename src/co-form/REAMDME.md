co-form组件的一些说明

-   props 属性/配置项

    -   labelWidthOffset:Number     表单项目名称宽度修正
    
    -   forceLabelWidth:Number      强制设置表单项目名称宽度
    
    -   maxLabelWidth:Number        限制表单项目名称最大名称宽度
    
    -   items:Array                 用来配置表单
        
        -   label                   表单域名称
      
        -   type
        
            -   text|textarea|password
            
                文本
            
            -   date            
            
                日期选择域输入输出为时间戳字符串
            
            -   number|int  
            
                数字
                
            -   select
            
                下拉选择，options:Array配置其候选项,[{value:10, name:"西安"}]
                
            -   bool|boolean
            
                单个选择框，表示勾选或者不选
                
                trueValue:* 选择状况下，派发的值
                 
                falseValue:*  未选情况下派发的值
                 
                checkboxLabel:Array|String  Array需要设置2项，trueValue时的label，和falseValue时的label。为字符串只是设置label
                
            -   其他字符串寻找组件下以type值为名称的具名slot，用来扩展更高级的功能
            
        -   attrs 直接赋给iview组件的v-model
        
        -   validators 验证规则，支持多种设置方式，如下
        
            -   Function
            
                -   具名并且以$开头的函数，则是validator生成器，函数的返回值，会被当做生成器使用，应该避免在函数内引用自身属性。
                
                -   上面规则之外的函数会被当做验证器{validator:func},
                
            -   Object  应形如{validator:func}
            
            -   Array   [{validator},...]
        
        -   render 
        
            支持使用render方式使用，render方式不会包裹formItem,形式
            
            ``function(h, ctx){return h...}``
           
                
-   value:Object                给表单赋值[支持v-model]
    
    
-   events 事件
    
    -   input                       表单被编辑派发表单对象[支持v-model简写】
    
-   methods

    -   resetValues()               重置表单为items内设置的默认值
    
    -   reset()                     重置表单，包括值和验证提示
    
    -   getData():Promise           验证并返回表单内容验证失败Promise.reject("");
        
        