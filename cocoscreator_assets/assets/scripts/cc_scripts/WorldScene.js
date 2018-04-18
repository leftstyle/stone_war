// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

var KBEngine = require("kbengine");
const kPlayerStartX = 657;
const kPlayerStartY = 29;

const kOtherPlayerStartX = 105;
const kOtherPlayerStartY = 34;

var entitypos = 0;
var entityID = 0;

cc.Class({
    extends: cc.Component,

    properties: {
        player: {
            default: null,
            type: cc.Node,
        },

        pipiPrefab: {
            default: null,
            type: cc.Prefab,
        },

        popPrefab: {
            default: null,
            type: cc.Prefab,
        },

        camera: {
            default: null,
            type: cc.Camera,
        },

        maxPlayerCount: 2,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.keyBoardListener = null;
        this.mouseListener = null;
        this.curPlayerCount = 0;
        this.entities = {};
        this.playerControl = null;

        this.initPhysicManager();
        this.installEvents();
        
    },

    initPhysicManager: function () {
        var manager = cc.director.getCollisionManager();
        manager.enabled = true;
        manager.enabledDebugDraw = true;
        manager.enabledDrawBoundingBox = true;

        cc.director.getPhysicsManager().enabled = true;
        cc.director.getPhysicsManager().debugDrawFlags = cc.PhysicsManager.DrawBits.e_aabbBit |
            cc.PhysicsManager.DrawBits.e_pairBit |
            cc.PhysicsManager.DrawBits.e_centerOfMassBit |
            cc.PhysicsManager.DrawBits.e_jointBit |
            cc.PhysicsManager.DrawBits.e_shapeBit |
            cc.PhysicsManager.DrawBits.e_rayCast;
    },

    installEvents : function() {
		// common
		KBEngine.Event.register("onKicked", this, "onKicked");
		KBEngine.Event.register("onDisconnected", this, "onDisconnected");
		KBEngine.Event.register("onConnectionState", this, "onConnectionState");
		KBEngine.Event.register("onReloginBaseappFailed", this, "onReloginBaseappFailed");
		KBEngine.Event.register("onReloginBaseappSuccessfully", this, "onReloginBaseappSuccessfully");

        // in world
        KBEngine.Event.register("onAvatarEnterWorld", this, "onAvatarEnterWorld");
		KBEngine.Event.register("onEnterWorld", this, "onEnterWorld");
        KBEngine.Event.register("onLeaveWorld", this, "onLeaveWorld");
        KBEngine.Event.register("updatePosition", this, "updatePosition");
        KBEngine.Event.register("otherAvatarOnJump", this, "otherAvatarOnJump");
        KBEngine.Event.register("set_position", this, "set_position");
    },

    getCurTime: function() {
        var date = new Date();
        return date.toLocaleTimeString();
    },


    onKicked : function(failedcode){
        
    },

    onDisconnected : function() {
       cc.log("disconnect! will try to reconnect...");
    },
    
    onReloginBaseappTimer : function(self) {
       cc.log("will try to reconnect(" + this.reloginCount + ")...");
    },
    
    onReloginBaseappFailed : function(failedcode)
    {
        KBEngine.INFO_MSG("reogin is failed(断线重连失败), err=" + KBEngine.app.serverErr(failedcode));   
    },
        
    onReloginBaseappSuccessfully : function(){
        cc.log("reogin is successfully!(断线重连成功!)");	
    },
        
    onConnectionState : function(success){
        if(!success) {
            KBEngine.ERROR_MSG("Connect(" + KBEngine.app.ip + ":" + KBEngine.app.port + ") is error! (连接错误)");
        }
        else {
            KBEngine.INFO_MSG("Connect successfully, please wait...(连接成功，请等候...)");
        }
    },

    onEnterWorld: function (entity) {
        if(!entity.isPlayer()) {
            var ae = null;

            if(entity.className == "Avatar") {
                if(entity.modelID == 0) {
                    ae = cc.instantiate(this.pipiPrefab);
                }else if(entity.modelID == 1) {
                    ae = cc.instantiate(this.popPrefab);
                }
                var action = ae.addComponent("AvatarAction");
                var anim = ae.addComponent("AvatarAnim");

                //注意顺序： anim ---> action
                anim.setModelID(entity.modelID);
                anim.setAnim(ae.getComponent(cc.Animation));

                action.setModelID(entity.modelID);
                action.setAnim(anim);
                action.setEntityId(entity.id);
                
                this.curPlayerCount++;
            }else if(entity.className == "Item") {

            }
            
            this.node.addChild(ae);
            ae.setPosition( entity.position.x*SCALE,  entity.position.z*SCALE);
            this.entities[entity.id] = ae;
            cc.log("7788 other  join room");
        }
    },

    onLeaveWorld: function (entity) {
        
    },

    onAvatarEnterWorld : function(rndUUID, eid, avatar){
        if(!this.player) {
            if(avatar.modelID == 0) {
                this.player = cc.instantiate(this.pipiPrefab);
            }else if(avatar.modelID == 1) {
                this.player = cc.instantiate(this.popPrefab);
            }

            var ctrl= this.player.addComponent("AvatarControl");
            var action= this.player.addComponent("AvatarAction");
            var anim= this.player.addComponent("AvatarAnim");
           
              //注意顺序： anim ---> action --->ctrl
            anim.setModelID(avatar.modelID);
            anim.setAnim(this.player.getComponent(cc.Animation));

            action.setAnim(anim);
            action.setModelID(avatar.modelID);
            action.setEntityId(avatar.id);

            ctrl.setPlayer(this.player);

            var cameraControl =this.camera.getComponent("CameraControl");
            cameraControl.setTarget(this.player);
            this.node.addChild(this.player);
            this.player.setPosition(avatar.position.x*SCALE, avatar.position.z*SCALE);
        }
    },

    otherAvatarOnJump: function(entity) {
        var ae = this.entities[entity.id];
		if(ae == undefined)
            return;
            
        ae.isOnGround = entity.isOnGround;
        if(!ae.isOnGround)
            return;

        var action = ae.getComponent("AvatarAction");
        action.onJump();
    },

    updatePosition : function(entity)
	{
        // 服务器同步到实体的新位置，我们需要将实体平滑移动到指定坐标点
		var ae = this.entities[entity.id];
		if(ae == undefined)
			return;
        ae.isOnGround = entity.isOnGround;
        
        var action = ae.getComponent("AvatarAction");
        var position = cc.p(entity.position.x*SCALE, entity.position.z*SCALE);
        action.setPosition(position);
    },	  
    
    set_position: function(entity) {
        var ae = this.entities[entity.id];
		if(ae == undefined)
			return;
		
		ae.x = entity.position.x * SCALE;
        ae.y = entity.position.z * SCALE;
        ae.setPosition(ae.x, ae.y);
    },
    
    
    update: function (dt) {
        
    },


    start () {
                
    },

});