// eslint-disable-next-line @typescript-eslint/no-var-requires
const CopyWebpackPlugin = require("copy-webpack-plugin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require("webpack");
module.exports = {
  filenameHashing: false,
  productionSourceMap: false,
  pages: {
    devtools: {
      entry: "src/devtoolsPage/main.ts",
      filename: "devtools/devtoolsPage.html"
    },
    options: {
      entry: "src/options/main.ts",
      filename: "options/options.html"
    }
  },
  configureWebpack: {
    entry: {
      initDevtools: "./src/entry/initDevtools.ts",
      background: "./src/background.ts"
    },
    output: {
      filename: "js/[name].js"
    },
    plugins: [
      new CopyWebpackPlugin([
        {
          from: "./src/entry/initDevtools.html",
          to: "entry/initDevtools.html"
        },
        {
          from: "./src/manifest.json",
          to: "manifest.json"
        }
      ]),
      new webpack.DefinePlugin({
        global: "window"
      })
    ]
  },
  // 这儿删除不要生成chunk-vendors.js
  chainWebpack: config => {
    config.optimization.delete("splitChunks");
  }
};
