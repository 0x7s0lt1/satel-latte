let scene,camera,renderer,controls,mouse,marker,sat_model,point_light;

let changeSatelliteModel,drawOrbits;

let clock = new THREE.Clock();

let raycaster = new THREE.Raycaster();

let isMobile = navigator.userAgent &&
    navigator.userAgent.toLowerCase().indexOf('mobile') >= 0;
let isSmall = window.innerWidth < 1000;

import * as THREE from 'https://cdn.skypack.dev/three@v0.131.3';
import { GLTFLoader } from 'https://cdn.skypack.dev/pin/three@v0.131.3-QQa34rwf1xM5cawaQLl8/mode=imports,min/unoptimized/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.skypack.dev/pin/three@v0.131.3-QQa34rwf1xM5cawaQLl8/mode=imports,min/unoptimized/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/pin/three@v0.131.3-QQa34rwf1xM5cawaQLl8/mode=imports,min/unoptimized/examples/jsm/controls/OrbitControls.js';


function init(){

    scene = new THREE.Scene();
 
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
    );

    renderer = new THREE.WebGLRenderer({antialias:true,alpha: false});
    renderer.setSize(window.innerWidth,window.innerHeight);

    renderer.domElement.addEventListener("click", onclick, true);

    mouse = new THREE.Vector2();

    document.getElementById('three_map').appendChild(renderer.domElement);

    function onResize(){
        renderer.domElement.style.width = window.innerWidth + "px";
        renderer.domElement.style.height = window.innerHeight + "px";
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth,window.innerHeight);
    
    }
    window.addEventListener("resize",onResize);
    onResize();

    function onclick(){

        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(scene.children, true); //array
    
        if (intersects.length > 0) {
            
            //console.log(intersects[0].object.name);
            controls.target =  intersects[0].object.getWorldPosition(new THREE.Vector3());
    
        }
    
    }
    const Cubeloader = new THREE.CubeTextureLoader();
    const texture = Cubeloader.load([
            
                'assets/images/skybox/space/space_lf.png',
                'assets/images/skybox/space/space_rt.png',
                'assets/images/skybox/space/space_dn.png',
                'assets/images/skybox/space/space_up.png',
                'assets/images/skybox/space/space_ft.png',
                'assets/images/skybox/space/space_bk.png'
        
            ]);

            

    scene.background = texture;

    const GLTFloader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( 'https://cdn.skypack.dev/pin/three@v0.131.3-QQa34rwf1xM5cawaQLl8/mode=imports,min/unoptimized/examples/jsm/libs/draco/');
    GLTFloader.setDRACOLoader( dracoLoader );
    

    controls = new OrbitControls(camera,renderer.domElement);

    controls.minDistance = 70;
    controls.maxDistance = 300;

    controls.enableDamping= true;
    controls.enableKeys = false;
    controls.enablePan = false;

    /*
    controls.minAzimuthAngle = 6;
    controls.maxAzimuthAngle = 7;
    controls.maxPolarAngle = 2.5;
    controls.minPolarAngle = 2.2;

    controls.enableZoom = false;
    controls.enableDamping= true;
    controls.enableKeys = false;
    controls.enablePan = false;
    controls.enabled = true;


    */

    

    function randomStarPosition(){
        return Math.floor((Math.random() * ( 300 - -300 + 1 )) - 250) ;
    }

    for(let i =0; i< 50; i++){
        let  star = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshBasicMaterial({color:0xffffff}));
        
            star.position.x = randomStarPosition();
            star.position.y = randomStarPosition();
            star.position.z = randomStarPosition();
    
            scene.add(star);
    }

    var obj = new THREE.Object3D();
    marker = new THREE.Object3D();

    marker.name = 'marker';

    var earth = new THREE.Mesh(
        new THREE.SphereGeometry(50, 32, 32),
        new THREE.MeshBasicMaterial({map: THREE.ImageUtils.loadTexture("assets/images/textures/map2.jpg")}));
    earth.name = 'earth';

    GLTFloader.load('./assets/3d/default_sat.glb',(gltf)=>{

    
        sat_model = gltf;
        sat_model.scene.name = 'satellite';
        sat_model.scene.scale.x = 0.1;
        sat_model.scene.scale.y = 0.1;
        sat_model.scene.scale.z = 0.1;
        sat_model.scene.position.set(70,0,0);
        sat_model.scene.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));

		point_light =  new THREE.Mesh( 
            new THREE.SphereGeometry( 0.5, 32, 32 ),
            new THREE.MeshBasicMaterial( { color: 0xff1100,transparent: true } ) ) ;
        point_light.name = 'point_light';    

        point_light.position.set(71,0,0);
        point_light.material.opacity = 0.6;
		
                createjs.Tween.get(point_light.scale,{loop :true}).to({x : 10, y : 10, z: 10},3000);
                createjs.Tween.get(point_light.material,{loop :true}).to({opacity:0},1000);

                
        marker.add(point_light);
        marker.add(sat_model.scene);

        
        //controls.target =  gltf.scene.getWorldPosition(new THREE.Vector3());

    });

    changeSatelliteModel = (src)=>{

        marker.remove(sat_model.scene);

        GLTFloader.load('./assets/3d/'+src+'.glb',(gltf)=>{
            sat_model =  gltf;
            sat_model.scene.scale.x = 0.1;
            sat_model.scene.scale.y = 0.1;
            sat_model.scene.scale.z = 0.1;
            sat_model.scene.position.set(70,0,0);

            sat_model.scene.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));

                marker.add(sat_model.scene);
        });

    }

    

    /*
    var pointer = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 0, 10),
        new THREE.MeshPhongMaterial({color: 0xcc9900}));

    pointer.position.set(55, 0, 0); // rotating obj should set (X > 0, 0, 0)
    pointer.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
    
    marker.add(pointer);

    */

    
    obj.add(marker);
    obj.add(earth);
    scene.add(obj);
    
    var cords = {
        lat : 47.494341,
        lng : 19.252689
    }


    var lightA = new THREE.AmbientLight(0xffffff);
    //lightA.position.set(0, 200, 0);
    scene.add(lightA);
    
    var rad = Math.PI / 180;
    
        marker.quaternion.setFromEuler(
            new THREE.Euler(0, cords.lng * rad, cords.lat * rad, "YZX")); 





    camera.position.z += 200;

        

    drawOrbits = ()=>{

        let points = [];
        
        let startPoint = new THREE.Vector3(window.sat_orbits[1][0],window.sat_orbits[1][1]);
        let endPoint = window.sat_orbits[1][window.sat_orbits[1].lenth - 1];
        
        var line = new THREE.Line( 
            new THREE.BufferGeometry().setFromPoints( points ), 
            new THREE.LineBasicMaterial( { color: 0xf5b905 } ) );


            //console.log(line);

            //marker.add(line);
            
    }


    animate();



}
 

 


function animate(){

    requestAnimationFrame(animate);

    renderer.clear();
    renderer.render(scene,camera);
    controls.update();

    if(window.sat_is_changed){
        if(window.tles[window.current_sat].has3D != ""){
            changeSatelliteModel(window.current_sat);
        }
        window.sat_is_changed = false;
    }

    if(window.sat_cords != undefined){

        marker.quaternion.setFromEuler(
            new THREE.Euler(window.sat_cords.lat * Math.PI / 180,0, window.sat_cords.lng * Math.PI / 180,"XYZ"));

            //drawOrbits();

    }

    sat_model.scene.rotation.x += 0.0003;
    sat_model.scene.rotation.y += 0.0003;
    sat_model.scene.rotation.z += 0.0003;


    //console.log(controls.getDistance());
    
}


init();


