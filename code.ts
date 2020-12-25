// import _ from 'lodash';

let capitals = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let lowercase = "abcdefghijklmnopqrstuvwxyz";
let numbers = "0123456789";
// let symbols = ".,;:'\"~&*!@#$"

let glyphSets = [capitals, lowercase, numbers];

var components = {};


figma.showUI(__html__);

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  if (msg.type === 'log-components') {
    logComponents();
  } else if (msg.type === 'create-spacing') {
    createSpacingStrings();
    // figma.closePlugin();

  } else if (msg.type == 'add-text') {
    renderText(msg.data)
  } else if (msg.type == 'new-typeface') {
    createNewTypeface();
  }
}


function logComponents() {
  // all components must be glyphs in the short term
  figma.root.children.map(page => {
    page.findAll(n => n.type == 'COMPONENT').map(node => {
      // map each node into a hash table with its name as it key for easy access
      components[node.name] = <ComponentNode> node;
    })
  })
  // components = Object.keys(components).sort().reduce( 
  //   (obj, key) => ({ obj[key]: components[key] }), {}
  // );
}

let createFrame = function(): FrameNode {
  var frame = figma.createFrame();
  
  return frame;
}

let buildSpacingString = function(glyph: string): string {
  var spacingString = "";
  if (capitals.includes(glyph)) {
    spacingString = "HHH" + glyph + "HHH" + glyph + "OOO" + glyph + "OOO";
  } else if (lowercase.includes(glyph)) {
    spacingString = "nnn" + glyph + "nnn" + glyph + "ooo" + glyph + "ooo";
  } else if (numbers.includes(glyph)) {
    spacingString = "111" + glyph + "111" + glyph + "000" + glyph + "000";
  }
  return spacingString;
}

function addGlyphsToFrame(string: string) {
  let x = 0;
  let y = 0;
  if (figma.currentPage.children.length > 0) {
    var lastNode: SceneNode = figma.currentPage.children[figma.currentPage.children.length-1];
    y = lastNode.y + lastNode.height + 50;
    x = lastNode.x;
  }
  let frame = createFrame();
  for (let glyph of string) {
    // if the current glyph exists in your component set
    if (components[glyph]) {
      frame.appendChild(components[glyph].createInstance());
    } else {
      // should error
    }
  }
  frame.layoutMode = "HORIZONTAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO"
  frame.horizontalPadding = 20;
  frame.verticalPadding = 40;
  frame.x = x;
  frame.y = y;
  return frame;
}

function createSpacingStrings() {
  // capitals only first
  // Create a a spacing string for every glyph component that exists within Capitals string
  for (const glyph of capitals) {
    let node = components[glyph];
    if (node) {
      var spacingString = buildSpacingString(glyph);
      var frame = addGlyphsToFrame(spacingString);
      frame.name = "Spacing/"+glyph;
      figma.currentPage.appendChild(frame);
    }
  }
}

function renderText(string: string) {
  var frame = addGlyphsToFrame(string);
  frame.name = string
  figma.currentPage.appendChild(frame);
}

function createNewTypeface() {
  // The typeface will be created on a new page

  var page = figma.createPage();
  page.name = "New typeface"
  var x = 0;
  var y = 0;
  var w = 100;
  var h = 100;
  var xStart = 0;
  for (var set of glyphSets) {
    console.log(set);
    for (let i=1; i<=set.length; i++) {
      let comp = figma.createComponent();
      page.appendChild(comp);
      comp.resize(w, h);
      comp.name = set[i-1];
      comp.x = x;
      comp.y = y;

      x = ((i % 5 == 0) ? xStart : x + w + 20);
      y = ((i % 5 == 0) ? y + h + 20 : y);
    }
    xStart = xStart + (w+20)*5 + 200;
    x = xStart;
    y = 0;
  }


}






