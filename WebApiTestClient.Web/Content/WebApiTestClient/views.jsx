var WatcPanel = React.createClass({


  render:function(){
      console.log('in component');
      console.dir(this);
    return(
      <div id='watc-panel'>


          <div class="watc-container">


              <div><span id="watc-method">{this.props.Method}</span> <span id="watc-route">{this.props.Route}</span></div>


          </div>
      </div>
    )
  }
})


