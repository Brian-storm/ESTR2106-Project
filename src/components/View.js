import { useParams, Link } from 'react-router-dom'; // 导入路由相关

function View() {
    const {venueId} = useParams(); // 获取导航函数
    return (
        <div>
            <h1>Single view of venueId: {venueId}</h1> 
        </div>
    );
  }

  export default View;