let scene,camera,renderer,labelRenderer,labelDiv,clock,controls,raycaster,mouse,earth,clouds,marker,directionalLight,sat_model,label,point_light;

let changeSatelliteModel,drawOrbits;

let rad = Math.PI / 180;

import * as THREE from 'https://cdn.skypack.dev/three@v0.131.3';

import { GLTFLoader } from 'https://cdn.skypack.dev/pin/three@v0.131.3-QQa34rwf1xM5cawaQLl8/mode=imports,min/unoptimized/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.skypack.dev/pin/three@v0.131.3-QQa34rwf1xM5cawaQLl8/mode=imports,min/unoptimized/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/pin/three@v0.131.3-QQa34rwf1xM5cawaQLl8/mode=imports,min/unoptimized/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'https://cdn.skypack.dev/pin/three@v0.131.3-QQa34rwf1xM5cawaQLl8/mode=imports,min/unoptimized/examples/jsm/renderers/CSS2DRenderer.js';


function init(){


    THREE.DefaultLoadingManager.onProgress = function ( url, itemsLoaded, itemsTotal ) {

        let p = (itemsLoaded / itemsTotal * 100).toFixed();

        document.querySelector('.progress-bar').style.width = p + "%";
        document.querySelector('.progress-bar').textContent = p + "%";
        console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    
    };
    THREE.DefaultLoadingManager.onLoad = function ( ) {
        document.getElementById('loading').style.display = 'none';    
        document.querySelector('.progress-bar').style.display = 'none';
    };

    scene = new THREE.Scene();
 
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
    );

    renderer = new THREE.WebGLRenderer({antialias:true,alpha: false});
    renderer.setSize(window.innerWidth,window.innerHeight);
    document.getElementById('three_map').appendChild(renderer.domElement);
    
    
    labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize( window.innerWidth, window.innerHeight );
	labelRenderer.domElement.style.position = 'absolute';
	labelRenderer.domElement.style.top = '0px';
	document.getElementById('three_map').appendChild(labelRenderer.domElement);

    //mouse = new THREE.Vector2();
    //clock = new THREE.Clock();
    //raycaster = new THREE.Raycaster();

    let isMobile = navigator.userAgent &&
    navigator.userAgent.toLowerCase().indexOf('mobile') >= 0;
    let isSmall = window.innerWidth < 1000;

    function onResize(){
        renderer.domElement.style.width = window.innerWidth + "px";
        renderer.domElement.style.height = window.innerHeight + "px";
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth,window.innerHeight);
        labelRenderer.setSize( window.innerWidth, window.innerHeight );
    
    }

    window.addEventListener("resize",onResize);
    onResize();


    
    const Cubeloader = new THREE.CubeTextureLoader();
    const sky = Cubeloader.load([
            
                'assets/images/skybox/space/space_lf.png',
                'assets/images/skybox/space/space_rt.png',
                'assets/images/skybox/space/space_up.png',
                'assets/images/skybox/space/space_dn.png',
                'assets/images/skybox/space/space_ft.png',
                'assets/images/skybox/space/space_bk.png'
        
            ]);

            

    scene.background = sky;

    const TextureLoader = new THREE.TextureLoader();
    const GLTFloader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( './assets/draco/');
    GLTFloader.setDRACOLoader( dracoLoader );
    


    controls = new OrbitControls(camera,labelRenderer.domElement);

    controls.minDistance = 85;
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


    TextureLoader.load("assets/images/textures/earth_atmos_2048.jpg",(eTexture)=>{

        earth = new THREE.Mesh(
            new THREE.SphereGeometry(50, 32, 32),
            new THREE.MeshPhongMaterial({map: eTexture}));
            obj.add(earth);

            TextureLoader.load("assets/images/textures/earth_clouds_2048.png",(cTexture)=>{

                clouds = new THREE.Mesh(
                    new THREE.SphereGeometry(51, 32, 32),
                    new THREE.MeshPhongMaterial({map: cTexture,transparent: true,}));
                    obj.add(clouds);

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
                        
                                new TWEEN.Tween(point_light.scale)
                                .to({x : 10, y : 10, z: 10},3000)
                                .repeat(Infinity)
                                .start();
                
                                new TWEEN.Tween(point_light.material)
                                .to({opacity:0},1000)
                                .repeat(Infinity)
                                .start();
                
                
                        labelDiv = document.createElement( 'div' );
                        labelDiv.className = 'three_label';
                        labelDiv.textContent = '';
                        labelDiv.style.marginTop = '-1em';
                        label = new CSS2DObject( labelDiv );
                        label.position.set( 72,0,0);
                        labelDiv.addEventListener('click',()=>{
                            
                            new TWEEN.Tween(camera.position).to(
                                sat_model.scene.getWorldPosition(new THREE.Vector3()),
                                2000
                            ).start();
                            new TWEEN.Tween(camera.rotation).to(
                                sat_model.scene.getWorldQuaternion(new THREE.Vector3()),
                                2000
                            ).start();
                        })
                
                        marker.add( label );
                        marker.add(point_light);
                        marker.add(sat_model.scene);
                
                        scene.add(obj);
    
                    });

            });

    });
   

    
    

    

    changeSatelliteModel = (src)=>{

        marker.remove(sat_model.scene);
        obj.remove(marker);

        GLTFloader.load('./assets/3d/'+src+'.glb',(gltf)=>{
            sat_model =  gltf;
            sat_model.scene.scale.x = 0.1;
            sat_model.scene.scale.y = 0.1;
            sat_model.scene.scale.z = 0.1;
            sat_model.scene.position.set(70,0,0);
            sat_model.scene.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));

                marker.add(sat_model.scene);
                obj.add(marker);
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

    
    //var lightA = new THREE.AmbientLight(0xffffff);
    //lightA.position.set(0, 200, 0);
    //scene.add(lightA);

    directionalLight = new THREE.DirectionalLight( 0xffffff, 0.9 );
    scene.add( directionalLight );
    

    marker.quaternion.setFromEuler(
        new THREE.Euler(0, 19.252689* rad, 47.494341 * rad, "YZX")
        ); 


    camera.position.z += 200;

        

    drawOrbits = ()=>{

        let points = [];
        
        let startPoint = new THREE.Vector3(window.sat_orbits[1][0],window.sat_orbits[1][1]);
        let endPoint = window.sat_orbits[1][window.sat_orbits[1].lenth - 1];

        for(let i = 0; i < window.sat_orbits[1].length; i++ ){

            points.push(
                new THREE.Euler(
                    window.sat_orbits[1][i][0] * rad,
                    0, 
                    window.sat_orbits[1][i][1] * rad,
                    "XYZ"
                    )
                );

        }
        
        var line = new THREE.Line( 
            new THREE.BufferGeometry().setFromPoints( points ), 
            new THREE.LineBasicMaterial( { color: 0xf54242 } ) );

            //new THREE.Euler(window.sat_cords.lat * Math.PI / 180,0, window.sat_cords.lng * Math.PI / 180,"XYZ"));


            //console.log(line);

            marker.add(line);
            
    }


    animate();



}
 

 


function animate(){

    requestAnimationFrame(animate);

    if(window.sat_is_changed){
        
        if(window.tles[window.current_sat].has3D != ""){
            changeSatelliteModel("c_"+window.current_sat);
        }else{
            changeSatelliteModel('default_sat');
        }

        labelDiv.innerHTML = window.current_sat.toUpperCase();
        window.sat_is_changed = false;

    
        
    }

    if(window.sat_cords != undefined){

        marker.quaternion.setFromEuler(
            new THREE.Euler(window.sat_cords.lat * Math.PI / 180,0, window.sat_cords.lng * Math.PI / 180,"XYZ"));

            //drawOrbits();

    }

    if(sat_model != undefined){

        sat_model.scene.rotation.x += 0.0003;
        sat_model.scene.rotation.y += 0.0003;
        sat_model.scene.rotation.z += 0.0003;

        clouds.rotation.y += 0.0005;

    }
    
    
    directionalLight.position.copy(camera.position);
    directionalLight.rotation.copy(camera.rotation);

    //console.log(controls.getDistance());

    renderer.clear();
    controls.update();
    TWEEN.update();
    renderer.render(scene,camera);
    labelRenderer.render( scene, camera );
    
}


init();


