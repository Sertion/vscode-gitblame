import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

export default {
    input: "src/index.ts",
    output: {
        dir: "dist",
        format: "cjs",
    },
    external: [
        "vscode",
        "child_process",
        "fs",
        "url",
        "path",
    ],
    plugins: [
        typescript(),
        terser({
            ecma: 2020,
            compress: {
                inline: 2,
                keep_fargs: false,
                module: true,
                passes: 4,
                pure_getters: true,
                toplevel: true,
                unsafe: true,
                unsafe_arrows: true,
                unsafe_methods: true,
            },
            format: {
                ecma: 2020,
                semicolons: false,
            },
        }),
    ],
};
