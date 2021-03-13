// import _ from 'lodash';

let capitals = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let lowercase = "abcdefghijklmnopqrstuvwxyz";
let numbers = "0123456789";
// let symbols = ".,;:'\"~&*!@#$"

let glyphSets = [capitals, lowercase, numbers];

var currTypeface;
var currComponents = {};

// {name: Typeface}
var typefacesByName = {};

async function getTypefacesFromStorage() {
  // What is necessary at startup
  // List of names of typefaces
  // All the Typeface class objects which contain component glyphs
  // Local storage of storedTypefaces is formatted as keys = pageIds and values = Typeface objects
  figma.clientStorage.getAsync("typefaces").then(storedTypefaces => {
    figma.showUI(__html__);

    console.log("stored typefaces", storedTypefaces);

    postNamesToUI(storedTypefaces);

    saveByNames(storedTypefaces);

    // currTypeface = storedTypefaces[Object.keys(storedTypefaces)[0]];
  }).catch( function() {
    console.log("promise rejected")
  });

  // default to first in list for now!
  figma.clientStorage.getAsync("currTypeface").then(currTypeface => {
    if (currTypeface != undefined) {
      currTypeface.setAsCurrent();
    }
  })
  // currTypeface.setAsCurrent();

}

getTypefacesFromStorage();

function saveByNames(storedTypefaces) {
  for (const key in storedTypefaces) {
    const tf: Typeface = storedTypefaces[key];
    const name = tf.name;
    typefacesByName[name] = tf;
  }
}

function postNamesToUI(storedTypefaces) {
  var names = [];
  Object.keys(storedTypefaces).forEach(function (id) {
    var n = storedTypefaces[id].name
    names.push(n);
  }) 
  figma.ui.postMessage({typefaces: names})
}

  
// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  if (msg.type === 'log-components') {
    logCurrentPage();
  } else if (msg.type === 'create-spacing') {
    createSpacingStrings();
    // figma.closePlugin();

  } else if (msg.type == 'add-text') {
    renderText(msg.data)
  } else if (msg.type == 'new-typeface') {
    createNewPage();
  } else if (msg.type == 'select-option') {
    selectOption(msg.data);
  }
}

function selectOption(name: string) {
  const selectedTypeface: Typeface = typefacesByName[name];
  currTypeface = selectedTypeface
}


class Typeface {
  id: string;
  name: string;
  glyphDict: {string: ComponentNode} = {} as any; // this is prob bad??

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;

    typefacesByName[name] = this;

    currTypeface = this;
    figma.ui.postMessage({'addOption': this.name});

    // always log glyphs of new typefaces
    this.logGlyphs();
    this.updateLocalStorage();
    this.setAsCurrent();
  }

  logGlyphs() {
    console.log("LOG GLYPHS");
    // all components must be glyphs in the short term
    // figma.root.children.map(page => {
      //page.findAll

      console.log(this.glyphDict);
      figma.currentPage.findAll(n => n.type == 'COMPONENT').map(node => {
        // map each node into a hash table with its name as it key for easy access
        this.glyphDict[node.name] = <ComponentNode> node;
        console.log(node.name, node);
      })
  }


  async updateLocalStorage() {
    // "typefaces" : {id: this}
    // storedTypefaces evaluates to a dictionary where
    // keys = pageIds and values = Typeface objects
    // The Typeface object then contains everything we need for names and glyphsets
    figma.clientStorage.getAsync("typefaces").then(storedTypefaces => {
      
      console.log("check what's in local storage", storedTypefaces);
      if (storedTypefaces) {
        // The dict already exists
        // This typeface may already be in the dict, or not
        // In both cases, we just need to reassign the value
        storedTypefaces[this.id] = this;
        figma.clientStorage.setAsync("typefaces", storedTypefaces);
        console.log("update local storage", storedTypefaces);
      } else {
        // The dict not exist yet. Need to create the dictionary
        var newDict = {};
        newDict[this.id] = this;
        figma.clientStorage.setAsync("typefaces", newDict);
        console.log("started local storage dict", newDict);
      }
    })
  }


  setAsCurrent() {
    currTypeface = this;
    // figma.clientStorage.setAsync("currTypefaces", this);
  }
}


function logCurrentPage() {
  const currId = figma.currentPage.id;
  var pageName = figma.currentPage.name;
  if (pageName in typefacesByName) {
    console.log("Log current page:", pageName + " is in typefacesByName")
    console.log(typefacesByName[pageName])
    const typeface: Typeface = typefacesByName[pageName]
    typeface.logGlyphs();
  } else {

    typefacesByName[pageName] = new Typeface(currId, pageName);
  }
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
    const components = currTypeface.glyphDict;
    if (components[glyph]) {
      let component: ComponentNode = <ComponentNode> figma.getNodeById(components[glyph].id);
      frame.appendChild(component.createInstance());
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
  const components = currTypeface.glyphDict;

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

function createNewPage() {
  // The typeface will be created on a new page

  var page = figma.createPage();
  page.name = "New typeface"
  var x = 0;
  var y = 0;
  var w = 100;
  var h = 100;
  var xStart = 0;
  for (var set of glyphSets) {
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






