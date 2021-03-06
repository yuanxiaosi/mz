var React = require('react');
var indexService = require('../../../../../service/index.js');
import moment from 'moment';
var _ = require('lodash');
import { DatePicker, Select, Button, message, Cascader} from 'antd';
const { RangePicker } = DatePicker;
const Option = Select.Option;


var echarts = require('echarts');
var ExcellentExport = require('../../../../../util/excellentexport.min.js');


var main = React.createClass({
  getInitialState: function(){
    var me = this;
    return {
      region: me.props.region,
      business: me.props.business,
      selectRegionId: "0",
      selectBusinessId: "0",
      dateType: "3",
      startDate: "",
      endDate: "",
      tableData: {}
    }
  },
  componentWillMount: function(){ 
  },
  componentDidMount: function(){
    
  },
  getBusiness: function(regionId){
    var me = this;
    indexService.getBusiness(regionId).then(function(res){
      if(res.status == 0){
        me.setState({business: res.data})
      }else{
        message.info(res.msg);
      }
    })
  },
  RangePickerChange: function(value, dateString){
    this.setState({
      startDate: dateString[0],
      endDate: dateString[1]
    })
  },
  dateTypeChange: function(val){
    console.log(val)
    this.setState({dateType: val})
  },
  regionChange: function(value){
    var me = this;
    var regionId = 0;
    if(value[0] == 0){
      regionId = 0;
      me.setState({
        selectRegionId: regionId,
        selectBusinessId: "0"
      })
    }else{
      regionId = value[2]
      me.setState({
        selectRegionId: regionId,
        selectBusinessId: ""
      })
    }
    me.getBusiness(regionId);
  },
  businessChange: function(value){
    var me = this;
    this.setState({selectBusinessId: value})
  },
  search: function(){
    var me = this;
    var data = {
      startDate: me.state.startDate,
      endDate: me.state.endDate,
      isExport: "false",
      businessId: me.state.selectBusinessId.split('&')[0],
      dateType: me.state.dateType  //1-2-3 年-月-日
    }

    indexService.dataIncomeDetail(data).then(function(res){
      if(res.status == 0){
        var xyObj = me.getXYObj(res.data);
        me.setState({tableData: xyObj})
        me.initExcharts(xyObj);
        
      }else{
        message.info(res.msg);
      }
    })
  },
  initExcharts: function(obj){
    var op = {
      tooltip : {
        trigger: 'axis'
      },
      legend: {
        data:['总收入']
      },
      toolbox: {
        show : true,
        feature : {
          mark : {show: true},
          dataView : {show: true, readOnly: false},
          magicType : {show: true, type: ['line', 'bar']},
          restore : {show: true},
          saveAsImage : {show: true}
        }
      },
      calculable : true,
      xAxis : [
        {
          type : 'category',
          boundaryGap : false,
          data : obj.x
        }
      ],
      yAxis : [
        {
          type : 'value'
        }
      ],
      series : [
        {
          name:'总收入',
          type:'line',
          tiled: '总量',
          data: obj.y
        },
        
      ]
    };

    var echartsDom = document.querySelectorAll('.IncomeEcharts')[0].querySelector(".echarts")
    var myChart = echarts.init(echartsDom)
    myChart.setOption(op)
  },
  getXYObj: function(data){
    var xArr = [];
    var yArr = [];
    for(var i=0; i<data.length; i++){
      xArr.push(data[i].day)
      yArr.push((data[i].buyAmount + data[i].chargeAmount)/100)
    }
    return {
      x: xArr,
      y: yArr
    }
  },
  jsExport: function(){
    ExcellentExport.csv(this.refs.jsExport, 'incomeEchartsTable');
  },
  render: function () {
    var me = this;
    var tableData = me.state.tableData;
    var businessOption = me.state.business.map(function(v, key){
      var arr = [];
      arr.push(<Option key={key} value={v.id+"&"+v.name}>{v.name}</Option>)
      return arr
    })
  
    return (
      <div className="IncomeEcharts">
        <div className="title">
          收入趋势图
        </div>
        <div className="IncomeEchartsHeader">
          <div className="list" style={{width: "270px"}}>
            <span>选择时间：</span>
            <RangePicker
              /*defaultValue={[moment(me.state.startDate), moment(me.state.endDate)]}*/
              style={{width: "200px"}}
              disabledDate={(current)=>{return current && current.valueOf() > Date.now();}}
              size="large"
              format="YYYY-MM-DD"
              placeholder={['Start Time', 'End Time']}
              onChange={this.RangePickerChange}
            />
          </div>
          <div className="list" style={{width: "170px"}}>
            <span>周期：</span>
            <Select value={me.state.dateType} style={{ width: 120 }} onChange={me.dateTypeChange} showSearch>
              <Option key="1" value="1">年</Option>
              <Option key="2" value="2">月</Option>
              <Option key="3" value="3">日</Option>
            </Select>
          </div>
          <div className="list" style={{width: "270px"}}>
            <span>地区：</span>
            <Cascader style={{"marginTop":"-5px", "width":"220px"}} options={me.state.region} onChange={me.regionChange} defaultValue={["0"]} placeholder="请选择省市区" size="large" showSearch/>
          </div>
          <div className="list" style={{width: "180px"}}>
            <span>门店：</span>
            <Select value={me.state.selectBusinessId} style={{ width: 120 }} onChange={me.businessChange} showSearch>
              <Option className={me.state.selectRegionId!="0"?"hide":""} key="-1" value="0">全部</Option>
              { businessOption }
            </Select>
          </div>
          <div className="list" style={{width: "80px"}}>
            <Button size="large" type="primary" onClick={this.search}>筛选</Button>
          </div>
          <div className="list" style={{width: "80px"}}>
              <a className={"exportBtn"} download="aaa.csv" href={"#"} ref="jsExport" onClick={me.jsExport}>导  出</a>
          </div>
        </div>
        <div className="echarts"></div>
        <table className="hide" id="incomeEchartsTable">
          <tbody>
            <tr>
              <th></th>
              <th>收入</th>
            </tr>
            {
              !tableData.x?(
                  <tr>
                    <th></th>
                    <th></th>
                  </tr>
                ):tableData.x.map(function(v, k){
                return(
                  <tr key={k}>
                    <th>{v}</th>
                    <th>{tableData.y[k]}</th>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>
    )
  }
});

module.exports = main;