const rollup = require('rollup');
const optionLs = require("./rollup.config");
const glob = require("glob");

//配置
const DIST = "dist";
const SRC = "src";



async function build(inputOptions, outputOptions) {
    // create a bundle
    const bundle = await rollup.rollup(inputOptions);

    // console.log(bundle.imports); // an array of external dependencies
    // console.log(bundle.exports); // an array of names exported by the entry point
    // console.log(bundle.modules); // an array of module objects

    // generate code and a sourcemap
    // const { code, map } = await bundle.generate(outputOptions);

    // or write the bundle to disk
    await bundle.write(outputOptions);
}




glob("src/**/*.js", {}, async function (er, files) {
    if (er) {
        throw er;
    }

    let pathMaxLength = Math.max(...files.map(path => path.length));

    for (const opt of optionLs) {
        let inputOptions = opt;
        let outputOptions = opt.output;
        delete opt.output;
        for (const path of files) {
            let dir = path.replace(/\/[^/]*$/, "");
            let outdir = dir.replace(new RegExp(`^${SRC}`), DIST);
            let fileName = /\/([^/]*)$/.exec(path)[1];
            let fileNameNoExt = fileName.split(".").slice(0, -1).join(".");

            if (!fileName) {
                throw `路径解析失败:${path}`;
            }

            let outOrigFile = outputOptions.file;
            let ext = outOrigFile.split(".").slice(-2).join(".");

            //特例
            if (outputOptions.format == "umd") {
                ext = "js";
            }
            inputOptions.input = path;
            // outputOptions.file = outOrigFile.replace(/[\s\S]*(\/[^/]*)$/, outdir + "$1");

            outputOptions.file = outdir + "/" + fileNameNoExt + "." + ext;

            let spliter = Array(pathMaxLength - path.length).join(" ") + "    ";
            let logStr = `${inputOptions.input}${spliter}${outputOptions.file}`;
            try {
                await build(inputOptions, outputOptions);
                console.log("编译成功:", logStr);

            } catch (e) {
                console.log("编译失败:", logStr);
                console.error(e);
            }
        }
    }
})

// build();