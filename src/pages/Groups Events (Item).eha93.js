import wixLocation from 'wix-location';

$w.onReady(function () {

    $w('#box40').onClick(() => {
        wixLocation.to("https://luxelinkonline.wixstudio.com/llll/dashboard/academy");
    });

    $w('#box41').onClick(() => {
        wixLocation.to("https://luxelinkonline.wixstudio.com/llll/dashboard/community");
    });

    $w('#box42').onClick(() => {
        wixLocation.to("https://luxelinkonline.wixstudio.com/llll/dashboard/mentoring");
    });

    $w('#box43').onClick(() => {
        wixLocation.to("https://luxelinkonline.wixstudio.com/llll/dashboard/stats");
    });

    $w('#box54').onClick(() => {
        wixLocation.to("https://luxelinkonline.wixstudio.com/llll/dashboard");
    });

});