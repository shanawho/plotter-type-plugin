import _ from 'lodash';

figma.showUI(__html__);

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'create-spacing') {
    createSpacingStrings();

  }
  //   const nodes: SceneNode[] = [];
  //   for (let i = 0; i < msg.count; i++) {
  //     const rect = figma.createRectangle();
  //     rect.x = i * 150;
  //     rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
  //     figma.currentPage.appendChild(rect);
  //     nodes.push(rect);
  //   }
  //   figma.currentPage.selection = nodes;
  //   figma.viewport.scrollAndZoomIntoView(nodes);
  // }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
};

let capitals = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let lowercase = "abcdefghijklmnopqrstuvwxyz"
let numberss = "0123456789"
let symbols = ".,;:'\"~&*!@#$"

function createSpacingStrings() {
  // capitals only first

  var frame = figma.createFrame();
  frame.layoutMode = "HORIZONTAL";
  frame.horizontalPadding = 20;
  frame.verticalPadding = 40;


}

function findComponents() {
  
}


