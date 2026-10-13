// Own the stream, including requests that resolve after the user has closed it.
export function cameraSession(getMedia){
 let generation=0,stream=null;
 const stop=s=>s?.getTracks().forEach(track=>track.stop());
 return {
  close(){generation++;stop(stream);stream=null;},
  async open(){this.close();const current=generation;
   try{const result=await getMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}}});
    if(current!==generation){stop(result);return null;}stream=result;return result;
   }catch(error){if(current!==generation)return null;throw error;}
  }
 };
}
