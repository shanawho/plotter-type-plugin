// import _ from 'lodash';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let capitals = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let lowercase = "abcdefghijklmnopqrstuvwxyz";
let numbers = "0123456789";
// let symbols = ".,;:'\"~&*!@#$"
let glyphSets = [capitals, lowercase, numbers];
var currTypeface;
var currComponents = {};
// {name: Typeface}
var typefacesByName = {};
function getTypefacesFromStorage() {
    return __awaiter(this, void 0, void 0, function* () {
        // What is necessary at startup
        // List of names of typefaces
        // All the Typeface class objects which contain component glyphs
        // Local storage of storedTypefaces is formatted as keys = pageIds and values = Typeface objects
        var storedTypefaces = yield figma.clientStorage.getAsync("typefaces");
        console.log("typefaces:", storedTypefaces);
        figma.showUI(__html__);
        var names = [];
        storedTypefaces.keys().forEach(function (id, index) {
            names.push(storedTypefaces[id].name);
        });
        // default to first in list for now!
        currTypeface = yield figma.clientStorage.getAsync("currTypeface");
        figma.ui.postMessage({ typefaces: names });
        // loadUI(storedTypefaces);
    });
}
getTypefacesFromStorage();
// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
    if (msg.type === 'log-components') {
        logCurrentPage();
    }
    else if (msg.type === 'create-spacing') {
        createSpacingStrings();
        // figma.closePlugin();
    }
    else if (msg.type == 'add-text') {
        renderText(msg.data);
    }
    else if (msg.type == 'new-typeface') {
        createNewPage();
    }
    else if (msg.type == 'select-option') {
        selectOption(msg.data);
    }
};
function selectOption(name) {
    const selectedTypeface = typefacesByName[name];
    selectedTypeface.setAsCurrent();
}
class Typeface {
    constructor(id, name) {
        this.glyphDict = {};
        this.id = id;
        this.name = name;
        typefacesByName[name] = this;
        currTypeface = this;
        figma.ui.postMessage({ 'addOption': this.name });
        // always log glyphs of new typefaces
        this.logGlyphs();
        this.updateLocalStorage();
        this.setAsCurrent();
    }
    logGlyphs() {
        // all components must be glyphs in the short term
        // figma.root.children.map(page => {
        //page.findAll
        figma.currentPage.findAll(n => n.type == 'COMPONENT').map(node => {
            // map each node into a hash table with its name as it key for easy access
            this.glyphDict[node.name] = node;
        });
    }
    updateLocalStorage() {
        return __awaiter(this, void 0, void 0, function* () {
            // "typefaces" : {id: this}
            // storedTypefaces evaluates to a dictionary where
            // keys = pageIds and values = Typeface objects
            // The Typeface object then contains everything we need for names and glyphsets
            figma.clientStorage.getAsync("typefaces").then(storedTypefaces => {
                if (storedTypefaces) {
                    // The dict already exists
                    // This typeface may already be in the dict, or not
                    // In both cases, we just need to reassign the value
                    storedTypefaces[this.id] = this;
                    figma.clientStorage.setAsync("typefaces", storedTypefaces);
                }
                else {
                    // The dict not exist yet. Need to create the dictionary
                    var newDict = {};
                    newDict[this.id] = this;
                    figma.clientStorage.setAsync("typefaces", newDict);
                }
            });
        });
    }
    // getGlyphsFromLocalStorage() {
    //   return figma.clientStorage.getAsync(this.id);
    // }
    setAsCurrent() {
        currTypeface = this;
        console.log(this.name + "set as current");
        figma.clientStorage.setAsync("currTypefaces", this);
        // figma.ui.postMessage(this.name)
    }
}
// function loadFromLocalStorage() {
//   var typefaces = {};
//   figma.root.children.map(page => {
//     var t = await figma.clientStorage.getAsync(page.id);
//   }
//   return typefaces;
// }
function logCurrentPage() {
    const currId = figma.currentPage.id;
    var pageName = figma.currentPage.name;
    if (pageName in typefacesByName) {
        console.log("Log current page:", pageName + " is in typefacesByName");
        const typeface = typefacesByName[pageName];
        typeface.logGlyphs();
    }
    else {
        typefacesByName[pageName] = new Typeface(currId, pageName);
    }
}
let createFrame = function () {
    var frame = figma.createFrame();
    return frame;
};
let buildSpacingString = function (glyph) {
    var spacingString = "";
    if (capitals.includes(glyph)) {
        spacingString = "HHH" + glyph + "HHH" + glyph + "OOO" + glyph + "OOO";
    }
    else if (lowercase.includes(glyph)) {
        spacingString = "nnn" + glyph + "nnn" + glyph + "ooo" + glyph + "ooo";
    }
    else if (numbers.includes(glyph)) {
        spacingString = "111" + glyph + "111" + glyph + "000" + glyph + "000";
    }
    return spacingString;
};
function addGlyphsToFrame(string) {
    let x = 0;
    let y = 0;
    if (figma.currentPage.children.length > 0) {
        var lastNode = figma.currentPage.children[figma.currentPage.children.length - 1];
        y = lastNode.y + lastNode.height + 50;
        x = lastNode.x;
    }
    let frame = createFrame();
    console.log("currTypeface", currTypeface.name);
    for (let glyph of string) {
        // if the current glyph exists in your component set
        const components = currTypeface.glyphDict;
        if (components[glyph]) {
            frame.appendChild(components[glyph].createInstance());
        }
        else {
            // should error
        }
    }
    frame.layoutMode = "HORIZONTAL";
    frame.primaryAxisSizingMode = "AUTO";
    frame.counterAxisSizingMode = "AUTO";
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
            frame.name = "Spacing/" + glyph;
            figma.currentPage.appendChild(frame);
        }
    }
}
function renderText(string) {
    var frame = addGlyphsToFrame(string);
    frame.name = string;
    figma.currentPage.appendChild(frame);
}
function createNewPage() {
    // The typeface will be created on a new page
    var page = figma.createPage();
    page.name = "New typeface";
    var x = 0;
    var y = 0;
    var w = 100;
    var h = 100;
    var xStart = 0;
    for (var set of glyphSets) {
        console.log(set);
        for (let i = 1; i <= set.length; i++) {
            let comp = figma.createComponent();
            page.appendChild(comp);
            comp.resize(w, h);
            comp.name = set[i - 1];
            comp.x = x;
            comp.y = y;
            x = ((i % 5 == 0) ? xStart : x + w + 20);
            y = ((i % 5 == 0) ? y + h + 20 : y);
        }
        xStart = xStart + (w + 20) * 5 + 200;
        x = xStart;
        y = 0;
    }
}
