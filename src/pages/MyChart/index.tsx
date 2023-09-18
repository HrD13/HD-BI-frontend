import {deleteChartUsingGET, listMyChartByPageUsingPOST, reGenChartUsingGET} from '@/services/hdbi/chartController';

import { useModel } from '@@/exports';
import { Avatar,Button,Card,List,message,Result,Space } from 'antd';
import Search from "antd/es/input/Search";
import ReactECharts from 'echarts-for-react';
import React,{ useEffect,useState } from 'react';
/**
 * 我的图表页面
 * @constructor
 */
const MyChartPage: React.FC = () => {
  const initSearchParams = {
    current: 1,
    pageSize: 4,
    sortField: 'createTime',
    sortOrder: 'desc',
  };

  const [searchParams, setSearchParams] = useState<API.ChartQueryRequest>({ ...initSearchParams });
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState ?? {};
  const [chartList, setChartList] = useState<API.Chart[]>();
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [redoLoading, setRedoLoading] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await listMyChartByPageUsingPOST(searchParams);
      if (res.data) {
        setChartList(res.data.records ?? []);
        setTotal(res.data.total ?? 0);
        // 隐藏图表的 title
        if (res.data.records) {
          res.data.records.forEach(data => {
            if (3 === data.status) {
              const chartOption = JSON.parse(data.genChart ?? '{}');
              chartOption.title = undefined;
              data.genChart = JSON.stringify(chartOption);
            }
          })
        }
      } else {
        message.error('获取我的图表失败');
      }
    } catch (e: any) {
      message.error('获取我的图表失败，' + e.message);
    }
    setLoading(false);
  };

  // 删除
  const del = async (id: any) => {
    const res = await deleteChartUsingGET({id:id});
    if (res.code === 0) {
      message.info('删除成功');
    } else {
      message.info('删除失败');
    }
    loadData();
  };
  // 重新生成
  const redoGenChart = async (id: any) => {
    const res = await reGenChartUsingGET({id:id});
    if (res.code === 0) {
      setRedoLoading(true);
      message.info('已重新提交任务');
    } else {
      message.info('删除失败');
    }
    setTimeout(() => {
      loadData();
      setRedoLoading(false);
    }, 10000);
  };

  useEffect(() => {
    loadData();
  }, [searchParams]);

  // @ts-ignore
  return (
    <div className="my-chart-page">
      <div>
        <Search placeholder="请输入图表名称" enterButton loading={loading} onSearch={(value) => {
          // 设置搜索条件
          setSearchParams({
            ...initSearchParams,
            name: value,
          })
        }}/>
      </div>
      <div className="margin-16" />
      <List
        grid={{
          gutter: 16,
          xs: 1,
          sm: 1,
          md: 1,
          lg: 2,
          xl: 2,
          xxl: 2,
        }}
        pagination={{
          onChange: (page, pageSize) => {
            setSearchParams({
              ...searchParams,
              current: page,
              pageSize,
            })
          },
          current: searchParams.current,
          pageSize: searchParams.pageSize,
          total: total,
        }}
        loading={loading}
        dataSource={chartList}
        renderItem={(item) => (
          <List.Item key={item.id}>
            <Card style={{ width: '100%' }}>
              <List.Item.Meta
                avatar={<Avatar src={currentUser && currentUser.userAvatar} />}
                title={item.name}
                description={item.chartType ? '图表类型：' + item.chartType : undefined}
              />
              <>
                {
                  item.status === 1 && <>
                    <Result
                      status="warning"
                      title="待生成"
                      subTitle={item.execMessage ?? '当前图表生成队列繁忙，请耐心等候'}
                    />
                  </>
                }
                {
                  item.status === 2 && <>
                    <Result
                      status="info"
                      title="图表生成中"
                      subTitle={item.execMessage}
                    />
                  </>
                }
                {
                  item.status === 3 && <>
                    <div style={{ marginBottom: 16 }} />
                    <p>{'分析目标：' + item.goal}</p>
                    <div style={{ marginBottom: 16 }} />
                    <p>{'分析结果：' + item.genResult}</p>
                    <div style={{ marginBottom: 16 }} />
                    <ReactECharts option={item.genChart && JSON.parse(item.genChart)} />
                  </>
                }
                {
                  item.status === 4 && <>
                    <Result
                      status="error"
                      title="图表生成失败"
                      subTitle={item.execMessage}
                    />
                  </>
                }
              </>
              <Space wrap>
                <Button type="primary" onClick={() => redoGenChart(item.id)} disabled={item.status===3?true:false} loading={redoLoading}>重新生成</Button>
                <Button type="dashed" danger={true} onClick={() => del(item.id)}>删除</Button>
              </Space>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};
export default MyChartPage;
