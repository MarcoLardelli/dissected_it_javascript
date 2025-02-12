

function showMenu(origname){
  var name;
  if (origname===''){
    name = 'background';
  } else {
    name = origname;
  }
  hideAll();
  $('#container_'+name).show();
  if (name === 'distances'){
    $('#form').show();
  }
  $("#button_"+name).addClass('selected');
  document.location.hash = origname;
}

function initNavigation(){
  $("#button_distances").click( function() {
          showMenu('distances');
       }
    );
  $("#button_closest").click( function() {
        showMenu('closest');
      }
    );
  $("#button_background").click( function() {
        showMenu('background');
      }
    );
  $("#button_about").click( function() {
          showMenu('about')
      }
    );
  const hash = document.location.hash.substring(1);
  if (hash.length>0) {
    showMenu(hash);
  } else {
    showMenu('');
  }
}

function hideAll(){
  $('#container_distances').hide();
  $('#container_closest').hide();
  $('#container_background').hide();
  $('#container_about').hide();
  $('#form').hide();

  $("#button_distances").removeClass('selected');
  $("#button_closest").removeClass('selected');
  $("#button_background").removeClass('selected');
  $("#button_about").removeClass('selected');
}


let wordVectors;
let wordVectorsArray;
let words = [];

const defaultFormValue = "truck car man woman kiss love god animal passion";
const defaultFormValue2 = "feminine";


import * as THREE from '/three/three.module.js';

import { OrbitControls } from '/three/OrbitControls.js';

THREE.Cache.enabled = true;

let container, stats, permalink, hex;

let camera, cameraTarget, scene, renderer;

let group, textMesh1, textGeo, sphereGeo, line_material;

let controls,dirLight;

let firstLetter = true;

let text = "Woman",

  bevelEnabled = false,

  font = undefined,

  fontName = "helvetiker", // helvetiker, optimer, gentilis, droid sans, droid serif
  fontWeight = "regular"; // normal bold

const height = 2,
  size = 8,
  hover = 20,

  curveSegments = 4,

  bevelThickness = 1,
  bevelSize = 0.75;

const mirror = true;

const fontMap = {	"helvetiker": 0, };

const weightMap = {
  "regular": 0,
  "bold": 1
};

const reverseFontMap = [];
const reverseWeightMap = [];

for ( const i in fontMap ) reverseFontMap[ fontMap[ i ] ] = i;
for ( const i in weightMap ) reverseWeightMap[ weightMap[ i ] ] = i;

let targetRotation = 0;
let targetRotationOnPointerDown = 0;

let pointerX = 0;
let pointerXOnPointerDown = 0;

let windowHalfX = window.innerWidth / 2;

let fontIndex = 1;

const noOfPoints = 20;

let sphereMeshes = Array();
let textMeshes = Array();
let centerOffsets = Array();
let linesPositions = Array();
let lines = Array();

// https://gka.github.io/palettes/
const material_colors = [0x00429d,0x2854a6,0x3e67ae,0x507bb7,0x618fbf,0x73a2c6,0x85b7ce,0x9acbd5,0xb1dfdb,0xcdf1e0,0xffe5cc,0xffcab9,0xffaea5,0xfd9291,0xf4777f,0xe75d6f,0xd84360,0xc52a52,0xae1045,0x93003a];

let distanceMatrix = Array();

$('#loading_container').hide();
$('#navigation').show();

$(document).ready(function() {
  initNavigation();

  $("#vis_words").on('click focusin', function() {
    if (this.value === defaultFormValue) {
      this.value = '';
    }
  });

  $("#find_words").on('click focusin', function() {
    if (this.value === defaultFormValue2) {
      this.value = '';
    }
  });

  $( "#distances_form" ).submit(function( event ) {
    startVisualization($( "#vis_words" ).val());
    event.preventDefault();
  });

  $( "#vis_words" ).val(defaultFormValue);
  $( "#find_words" ).val(defaultFormValue2);

  init();
  animate();

  startSearch($( "#find_words" ).val());

  $( "#closest_form" ).submit(function( event ) {
    startSearch($( "#find_words" ).val());
    event.preventDefault();
  });
});

function startSearch(word){
  $.getJSON("/get_closest.php?word="+word, function(json) {
      $("#search_list").empty();
      for(var index in json) {
        $("#search_list").append("<li>"+json[index]+"</li>");
      }
  });
}

function init() {
  container = document.getElementById('container_distances')

  // CAMERA
  camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 15000 );

  cameraTarget = new THREE.Vector3( 0, 150, 0 );

  // SCENE
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xffffff);

  // LIGHTS
  dirLight = new THREE.DirectionalLight( 0xffffff, 0.75 );
  dirLight.position.set( 0, 0, 1 ).normalize();
  scene.add( dirLight );

  line_material = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 2 } );

  group = new THREE.Group();
  group.position.y = 100;

  scene.add( group );

  loadFont();

  // RENDERER
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  controls = new OrbitControls( camera, renderer.domElement );
  controls.addEventListener( 'change', render ); // use only if there is no animation loop
  controls.minDistance = 500;
  controls.maxDistance = 4000;
  controls.enablePan = true;
  controls.autoRotate = true;
  controls.enableZoom = true;

  camera.position.set( 0, 500, 1000 );
  controls.update();

  // EVENTS

  container.style.touchAction = 'none';

  window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

  windowHalfX = window.innerWidth / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}


function loadFont() {

  const loader = new THREE.FontLoader();
  loader.load( '/three/' + fontName + '_' + fontWeight + '.typeface.json', function ( response ) {

    font = response;

    startVisualization($( "#vis_words" ).val());

  } );

}

function drawLines() {

}

function createScene() {
  group.clear();

  sphereMeshes = new Array();
  textMeshes = new Array();
  centerOffsets = new Array();

  // the sphere
  const sphereGeo = new THREE.SphereGeometry( 10, 48, 24 );

  let i = 0;
  for (var word in wordVectors) {

    let x,y,z;

    if (i===0) {
      x = 0;
      y = 0;
      z = 0;
    } else {
      x = (Math.random()-0.5)*400;
      y = (Math.random()-0.5)*400;
      z = (Math.random()-0.5)*400;
    }

    const cmult = Math.floor(material_colors.length/Object.keys(wordVectors).length);
    const c = material_colors[i*cmult];

    const sphere_material = new THREE.MeshPhongMaterial( { color: c } );

    const sphereMesh = new THREE.Mesh( sphereGeo, sphere_material );

    sphereMesh.position.x = x;
    sphereMesh.position.y = y;
    sphereMesh.position.z = z;

    sphereMeshes[i]=sphereMesh;

    group.add( sphereMesh );

    // the text
    const textGeo = new THREE.TextGeometry( word, {

      font: font,

      size: size,
      height: height,
      curveSegments: curveSegments,

      bevelThickness: bevelThickness,
      bevelSize: bevelSize,
      bevelEnabled: bevelEnabled

    } );

    textGeo.computeBoundingBox();

    const centerOffset = - 0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );

    centerOffsets.push(centerOffset);

    const materials = [
      new THREE.MeshPhongMaterial( { color: c, flatShading: true } ), // front
      new THREE.MeshPhongMaterial( { color: c } ) // side
    ];
    const textMesh = new THREE.Mesh( textGeo, materials );

    textMesh.position.x = x + centerOffset;
    textMesh.position.y = y + hover;
    textMesh.position.z = z;

    textMesh.rotation.x = 0;
    textMesh.rotation.y = Math.PI * 2;

    textMeshes[i] = textMesh;

    group.add( textMesh );

    linesPositions = [];

    i++;
  }

  calcDistanceMatrix();

  // draw the lines
  lines = [];
  linesPositions = [];
  for (let i=0;i<words.length;i++) {

    const points = [];
    points.push( sphereMeshes[i].position );
    points.push( sphereMeshes[getNearestNeighbourIndex(i)].position );
    //console.log(i,getNearestNeighbourIndex(i));

    linesPositions.push(points)

    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const line = new THREE.Line( geometry, line_material );
    lines.push(line)
    group.add( line );
  }
}


function animateSpheres() {

  const SPRING_STRENGTH_BY_NODE_MASS = 0.02;

  const NO_OF_FRAMES_TO_CENTER_SELECTED=20;

  let selectedIndex = 0;

  for (let x=0;x<words.length;x++) {
    for (let y=x+1;y<words.length;y++) {

      if (x!==selectedIndex && y!==selectedIndex) {

        let directionVect = new THREE.Vector3();
        directionVect.x=sphereMeshes[x].position.x - sphereMeshes[y].position.x;
        directionVect.y=sphereMeshes[x].position.y - sphereMeshes[y].position.y;
        directionVect.z=sphereMeshes[x].position.z - sphereMeshes[y].position.z;
        // calculate distances
        let dist=directionVect.length();

        let dataDist=distanceMatrix[x][y]*400;  // look up from matrix
        // calc new velocity of node using newtons equation, dV=a*dt=F/m*dt
        // calculate force, F=f*(l-x), whith spring length l dependent on distance
        // division by dist makes directionVect a unity vector

        let velocity = new THREE.Vector3();
        velocity=directionVect.multiplyScalar((SPRING_STRENGTH_BY_NODE_MASS/dist)*(dataDist-dist));
        //console.log(dist,dataDist,velocity.length());

        sphereMeshes[x].position.x += velocity.x;
        sphereMeshes[x].position.y += velocity.y;
        sphereMeshes[x].position.z += velocity.z;

        sphereMeshes[y].position.x -= velocity.x;
        sphereMeshes[y].position.y -= velocity.y;
        sphereMeshes[y].position.z -= velocity.z;

        textMeshes[x].position.x += velocity.x;
        textMeshes[x].position.y += velocity.y;
        textMeshes[x].position.z += velocity.z;

        textMeshes[y].position.x -= velocity.x;
        textMeshes[y].position.y -= velocity.y;
        textMeshes[y].position.z -= velocity.z;

      }
   }
 }

 for (let i=0; i<linesPositions.length; i++) {
   let positions = lines[i].geometry.attributes.position.array;
   let startVect = sphereMeshes[i].position;
   let endVect = sphereMeshes[getNearestNeighbourIndex(i)].position;
   positions[ 0 ] = startVect.x;
   positions[ 1 ] = startVect.y;
   positions[ 2 ] = startVect.z;
   positions[ 3 ] = endVect.x;
   positions[ 4 ] = endVect.y;
   positions[ 5 ] = endVect.z;
   lines[i].geometry.attributes.position.needsUpdate = true;
 }
}


function animate() {

  requestAnimationFrame( animate );

  animateSpheres();

  // make texts look at camera
  textMeshes.forEach(function(item, index, array) {
      //item.lookAt(camera.quaternion);
      item.quaternion.copy(camera.quaternion);
  })

  // light should follow camera and look at center
  dirLight.position.copy( camera.position );
  dirLight.lookAt(0,0,0);

  controls.update();

  render();

}

function render() {

  //group.rotation.y += ( targetRotation - group.rotation.y ) * 0.05;

  camera.lookAt( cameraTarget );

  renderer.clear();
  renderer.render( scene, camera );

}

function getDistance(arr1,arr2) {
  var sp = 0;
  for(let i=0; i<arr1.length;i++) {
    sp += arr1[i]*arr2[i];
  }
  return 1 - (1 + sp)/2;
}

function getNearestNeighbourIndex(index){
  let nearestDist = 0;
  let nearestIndex = 0;
  let setFirst = false;
  for (let x = 0; x < distanceMatrix.length ;x++) {
      if (x!==index && (!setFirst || distanceMatrix[x][index]<nearestDist)){
          nearestDist = distanceMatrix[x][index];
          nearestIndex = x;
          setFirst = true;
      }
  }
  return nearestIndex;
}

function calcDistanceMatrix(){

  let l = words.length;

  distanceMatrix = [];
  for(let i=0; i<l;i++) {
    var dm = []
    for (let j=0;j<l;j++) {
      if (i===j) {
        dm.push(0.0);
      } else {
        dm.push(getDistance(wordVectorsArray[i],wordVectorsArray[j]));
      }
    }
    distanceMatrix.push(dm);
  }
}

function startVisualization(wordslist){

  wordslist = wordslist.replace(/,/g, " ");
  wordslist = wordslist.replace(/\./g, " ").trim();

  const wordsArr = wordslist.split(' ');

  // warning and abort if less than 3 words
  if (wordsArr.length<3) {
    alert("Enter at least 3 words!");
    return;
  }

  var queryString = wordsArr.join(',');
  $.getJSON("/get_dist_matrix.php?words="+queryString, function(json) {
      wordVectors = json;

      words = Object.keys(wordVectors);
      //alert(words);
      wordVectorsArray = [];
      for (var word in wordVectors) {
        wordVectorsArray.push(wordVectors[word]);
      }

      if (words.length<3) {
        alert("Some words not found in database. Now less than 3 left. Enter more words!");
        return;
      }

      createScene();
      //animateSpheres();
  });

}
