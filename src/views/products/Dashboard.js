import {
    CAlert, CBadge, CCard, CCardBody, CCardHeader, CCol, CDropdown, CDropdownItem, CDropdownMenu, CDropdownToggle,
    CListGroup, CListGroupItem, CRow, CTabContent, CTabPane
} from "@coreui/react";
import React, {useEffect, useRef, useState} from "react";
import {CChartLine} from "@coreui/react-chartjs";
import {useUserContext} from "../../context/UserContextProvider";
import {useProductContext} from "../../context/ProductContextProvider";
import {getProducts} from "../../utils/product-service";
import {Loader} from "../common/Loader";
import {Redirect, Switch} from "react-router-dom";
import {getStyle, hexToRgba} from "@coreui/utils";
import CIcon from "@coreui/icons-react";

const brandInfo = getStyle('info') || '#20a8d8'

const ComponentStates = {
    Loading: "loading",
    Error: "error",
    Displaying: "displaying",
    Redirect: "redirect"
}

const getDatasets = (qualityLevels) => {
    return [
        {
            label: 'Quality Level',
            backgroundColor: hexToRgba(brandInfo, 10),
            borderColor: brandInfo,
            pointHoverBackgroundColor: brandInfo,
            borderWidth: 2,
            data: qualityLevels
        }
    ]
}

const defaultOptions = {
    maintainAspectRatio: false,
    legend: {
        display: false
    },
    scales: {
        xAxes: [{
            gridLines: {
                drawOnChartArea: false
            }
        }],
        yAxes: [{
            ticks: {
                beginAtZero: true,
                maxTicksLimit: 5,
                stepSize: Math.ceil(25),
                max: 100
            },
            gridLines: {
                display: true
            }
        }]
    },
    elements: {
        point: {
            radius: 5,
            hitRadius: 10,
            hoverRadius: 4,
            hoverBorderWidth: 3
        }
    }
};

export const Dashboard = (props) => {

    const {getUserInfo} = useUserContext();
    const {products, setProducts} = useProductContext();

    const [componentState, setComponentState] = useState(ComponentStates.Loading);
    const [selectedProduct, setSelectedProduct] = useState(undefined);
    const [qualityLevels, setQualityLevels] = useState([]);
    const [releaseIds, setReleaseIds] = useState([]);
    const [selectedRelease, setSelectedRelease] = useState(undefined);
    const dropdownButtonTitle = useRef();
    const [activeTab, setActiveTab] = useState(0);

    const renderLoader = () => {
        return <CCardBody align="center">
            <Loader/>
        </CCardBody>;
    };

    useEffect(() => {
        if (!products) { // with direct link to the component
            const jwt = getUserInfo()?.jwt;
            if (jwt) {
                getProducts(jwt)
                    .then((products) => {
                        if (products.length > 0) {
                            const id = props.match.params.id;
                            const product = products.find(product => product.id.toString() === id);

                            if (product) {
                                setProducts(products);
                                setSelectedProduct(product);
                                setComponentState(ComponentStates.Displaying);
                            } else {
                                setComponentState(ComponentStates.Redirect);
                            }
                        } else {
                            setComponentState(ComponentStates.Redirect);
                        }
                    })
                    .catch(() => {
                        setComponentState(ComponentStates.Redirect);
                    })
            } else {

            }
        } else { // with navigating through ProductList compoenent
            const id = props.match.params.id;
            const product = products.find(product => product.id.toString() === id);
            if (product) {
                setSelectedProduct(product);
                setComponentState(ComponentStates.Displaying);
            } else {
                setComponentState(ComponentStates.Redirect);
            }
        }
    }, []);

    useEffect(() => {
        if (selectedProduct?.releaseInfo?.length > 0) {
            const qualityLevels = selectedProduct.releaseInfo.map(rel => rel.qualityLevel * 100);
            const releaseIds = selectedProduct.releaseInfo.map(rel => {
                const timestamp = rel.created;
                const date = new Date(timestamp);
                return date.getDate() + ". " + date.toString().split(" ")[1] + " " + date.getFullYear() +
                    ", " + date.getHours() + ":" + date.getMinutes();
            });
            setQualityLevels(qualityLevels);
            setReleaseIds(releaseIds);
        }
    }, [selectedProduct])

    const onDropdownItemClick = (idx, rel) => {
        const selRel = selectedProduct.releaseInfo[idx]
        dropdownButtonTitle.current = rel;
        setSelectedRelease(selRel);
    }

    const renderDropdown = () => {
        return <CDropdown className="m-1 btn-group">
            <CDropdownToggle color="primary">
                {selectedRelease ? dropdownButtonTitle.current : "Select Release"}
            </CDropdownToggle>
            <CDropdownMenu placement="right">
                <CDropdownItem header>Select Release </CDropdownItem>
                {releaseIds.map((rel, idx) => {
                    return (
                        <CDropdownItem onClick={() => onDropdownItemClick(idx, rel)}>{rel}</CDropdownItem>
                    )
                })}
            </CDropdownMenu>
        </CDropdown>
    }

    const renderDetailView = () => {
        const MAX_GRAPH_ELEMENTS = 20;
        if (qualityLevels.length > 0) {
            const datasets = getDatasets(qualityLevels);
            const getBadge = (qualityLevel) => {
                if (qualityLevel >= 0.75) {
                    return "success";
                } else if (qualityLevel >= 0.5) {
                    return 'warning';
                } else if (qualityLevel < 0.5) {
                    return "danger";
                } else {
                    return "info";
                }
            };

            const getRating = (rating) => {
                if (rating === 1.0) {
                    return <CBadge color="success">A</CBadge>;
                } else if (rating === 2.0) {
                    return <CBadge color="success">B</CBadge>;
                } else if (rating === 3.0) {
                    return <CBadge color="warning">C</CBadge>;
                } else if (rating === 2.0) {
                    return <CBadge color="warning">D</CBadge>;
                } else {
                    return <CBadge color="danger">E</CBadge>;
                }
            };

            const getDebtTime = (time) => {
                const hours = Math.floor(time / 60);
                const minutes = time % 60;
                return hours > 0 ? hours + "h " + minutes + "min" : minutes + "min";
            };
            const qualityLevel = selectedRelease?.qualityLevel;
            return (<>
                    <CCardBody>
                        <CChartLine
                            style={{height: '300px', marginTop: '40px'}}
                            datasets={datasets.slice(0, MAX_GRAPH_ELEMENTS)}
                            labels={releaseIds.slice(0, MAX_GRAPH_ELEMENTS)}
                            options={defaultOptions}
                        />
                    </CCardBody>
                    <hr/>
                    <CCardBody>
                        <CRow>
                            <CCol xs={12} sm={8} lg={9}>
                                <div style={{fontSize: "medium"}}>
                                    <CIcon name="cib-skyliner"/> Release: {renderDropdown()}
                                </div>
                            </CCol>
                            {selectedRelease
                             ? <CCol xs={12} sm={4} lg={3}>
                                 <div style={{marginTop: "4px"}}>
                                     <CBadge color={getBadge(qualityLevel)}>
                                         <div style={{fontSize: "medium", padding: "7px"}}>
                                             Quality Level: {qualityLevel * 100}%
                                         </div>
                                     </CBadge>
                                 </div>
                             </CCol>
                             : null}
                        </CRow>
                        <br/>
                        <br/>
                        {selectedRelease
                         ? <CRow>
                             <CCol xs="12" sm="4">
                                 <CListGroup id="list-tab" role="tablist">
                                     <CListGroupItem disabled>Inspect details from:</CListGroupItem>
                                     {selectedRelease.releaseInfoSonarqube
                                      ? <CListGroupItem onClick={() => setActiveTab(1)} action
                                                        active={activeTab === 1}>
                                          <CIcon name="cil-rss"/> Sonarqube
                                     </CListGroupItem>
                                      : null}
                                     {selectedRelease.releaseInfoJira
                                      ? <CListGroupItem onClick={() => setActiveTab(2)} action
                                                        active={activeTab === 2}>
                                          <CIcon name="cib-jira"/> Jira
                                     </CListGroupItem>
                                      : null}
                                 </CListGroup>
                             </CCol>
                             <CCol xs="12" sm="8">
                                 <CTabContent>
                                     <CTabPane active={activeTab === 1}>
                                         <CCard>
                                             <CCardHeader>
                                                 <CIcon name="cil-rss"/> Sonarqube
                                                 <small> scan info</small>
                                             </CCardHeader>
                                             <CCardBody>
                                                 <CListGroup>
                                                     <CListGroupItem color="light">Quality
                                                                                   characteristics</CListGroupItem>
                                                     <CListGroupItem>
                                                         <CRow>
                                                             <CCol xs="5" md="3">
                                                                 <div style={{fontSize: "medium"}}>Reliability</div>
                                                             </CCol>
                                                             <CCol xs="3" md="3">
                                                                 Rating: {getRating(
                                                                 selectedRelease.releaseInfoSonarqube?.reliabilityRating)}
                                                             </CCol>
                                                             <CCol xs="4" md="3">
                                                                 <CIcon
                                                                     name="cil-bug"/> Bugs: {selectedRelease.releaseInfoSonarqube?.reliabilityBugs}
                                                             </CCol>
                                                         </CRow>
                                                     </CListGroupItem>
                                                     <CListGroupItem>
                                                         <CRow>
                                                             <CCol xs="5" md="3">
                                                                 <div style={{fontSize: "medium"}}>Security</div>
                                                             </CCol>
                                                             <CCol xs="3" md="3">
                                                                 Rating: {getRating(
                                                                 selectedRelease.releaseInfoSonarqube?.securityRating)}
                                                             </CCol>
                                                             <CCol xs="4" md="3">
                                                                 <CIcon
                                                                     name="cil-lock-unlocked"/> Vulnerabilities: {selectedRelease.releaseInfoSonarqube?.securityVulnerabilities}
                                                             </CCol>
                                                         </CRow>
                                                     </CListGroupItem>
                                                     <CListGroupItem>
                                                         <CRow>
                                                             <CCol xs="5" md="3">
                                                                 <div style={{fontSize: "medium"}}>Maintainability</div>
                                                             </CCol>
                                                             <CCol xs="3" md="3">
                                                                 Rating: {getRating(
                                                                 selectedRelease.releaseInfoSonarqube?.maintainabilityRating)}
                                                             </CCol>
                                                             <CCol xs="4" md="3">
                                                                 <CIcon name="cil-burn"/> Code
                                                                                          Smells: {selectedRelease.releaseInfoSonarqube?.maintainabilitySmells}
                                                             </CCol>
                                                             <CCol xs="4" md="3">
                                                                 <CIcon name="cil-clock"/> Debt: {getDebtTime(
                                                                 selectedRelease.releaseInfoSonarqube?.maintainabilityDebt)}
                                                             </CCol>
                                                         </CRow>
                                                     </CListGroupItem>
                                                 </CListGroup>
                                             </CCardBody>
                                         </CCard>
                                     </CTabPane>
                                     <CTabPane active={activeTab === 2}>
                                         <p>Ut ut do pariatur aliquip aliqua aliquip exercitation do nostrud commodo
                                            reprehenderit aute ipsum voluptate. Irure Lorem et laboris
                                            nostrud amet cupidatat cupidatat anim do ut velit mollit consequat enim
                                            tempor. Consectetur
                                            est minim nostrud nostrud consectetur irure labore voluptate irure. Ipsum id
                                            Lorem sit sint voluptate est pariatur eu ad cupidatat et
                                            deserunt culpa sit eiusmod deserunt. Consectetur et fugiat anim do eiusmod
                                            aliquip nulla
                                            laborum elit adipisicing pariatur cillum.</p>
                                     </CTabPane>
                                     <CTabPane active={activeTab === 3}>
                                         <p>Irure enim occaecat labore sit qui aliquip reprehenderit amet velit.
                                            Deserunt ullamco ex elit nostrud ut dolore nisi officia magna
                                            sit occaecat laboris sunt dolor. Nisi eu minim cillum occaecat aute est
                                            cupidatat aliqua labore
                                            aute occaecat ea aliquip sunt amet. Aute mollit dolor ut exercitation irure
                                            commodo non amet consectetur quis amet culpa. Quis ullamco
                                            nisi amet qui aute irure eu. Magna labore dolor quis ex labore id nostrud
                                            deserunt dolor
                                            eiusmod eu pariatur culpa mollit in irure.</p>
                                     </CTabPane>
                                 </CTabContent>
                             </CCol>
                         </CRow>
                         : null}
                    </CCardBody>
                </>
            );
        }

    return (
        <CCardBody>
            <CAlert color="info">
                No release info to display. Trigger release info collection on this product to see initial
                results
            </CAlert>
        </CCardBody>
    );
    }

    const renderRedirect = () =>
        {
            return (
                <Switch>
                    <Redirect to="/products/all"/>
                </Switch>
            )
        }

    const renderBody = () =>
        {
            switch (componentState) {
                case ComponentStates.Loading:
                    return renderLoader();
                case ComponentStates.Displaying:
                    return renderDetailView();
                case ComponentStates.Redirect: // fall-through
                default:
                    return renderRedirect();
            }
        }

    return (
        <CCard>
            {renderBody()}
        </CCard>
    );
    }

    export default Dashboard
