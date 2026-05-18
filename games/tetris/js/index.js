var frame;

function initGame()
{
	frame = new GameFrame(38,10,20);
	frame.init();

   document.body.addEventListener("keydown", MoveOrChange, { passive: false });

}

function changespeed(){
	frame.changespeed();
}

function regame(){
	location.reload();
}


function MoveOrChange(e)
{
	var kc = e.keyCode;
	// 阻止方向键的浏览器默认行为（滚动/翻页）
	if (kc === 38 || kc === 37 || kc === 39 || kc === 40) {
		e.preventDefault();
	}

	switch(kc)
	{
		case 38: //变形（上方向键）
			frame.Change();
			break;
		case 37: //左移动
			frame.MoveLeft();
			break;
		case 39://右移动
			frame.MoveRight();
			break;
		case 40:  //向下
			frame.MoveDown();
			break;
	}
}
