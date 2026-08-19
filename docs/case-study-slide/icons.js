// Render react-icons to PNG (white glyphs, transparent bg) for use in colored circles
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");

const { FaWindows, FaLinux, FaSyncAlt, FaFileAlt, FaCheckDouble, FaCogs, FaExchangeAlt } = require("react-icons/fa");
const { SiAnsible } = require("react-icons/si");

const icons = {
  windows: FaWindows,
  linux: FaLinux,
  sync: FaSyncAlt,
  file: FaFileAlt,
  check: FaCheckDouble,
  cogs: FaCogs,
  exchange: FaExchangeAlt,
  ansible: SiAnsible,
};

(async () => {
  fs.mkdirSync("icons", { recursive: true });
  for (const [name, Icon] of Object.entries(icons)) {
    const svg = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Icon, { color: "#FFFFFF", size: 512 })
    );
    await sharp(Buffer.from(svg)).resize(512, 512).png().toFile(`icons/${name}.png`);
    console.log("wrote icons/" + name + ".png");
  }
})();
