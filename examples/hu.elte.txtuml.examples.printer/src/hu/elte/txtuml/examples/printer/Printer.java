package hu.elte.txtuml.examples.printer;

import hu.elte.txtuml.api.model.Action;
import hu.elte.txtuml.api.model.Association;
import hu.elte.txtuml.api.model.From;
import hu.elte.txtuml.api.model.Model;
import hu.elte.txtuml.api.model.ModelBool;
import hu.elte.txtuml.api.model.ModelClass;
import hu.elte.txtuml.api.model.ModelExecutor;
import hu.elte.txtuml.api.model.ModelInt;
import hu.elte.txtuml.api.model.Signal;
import hu.elte.txtuml.api.model.To;
import hu.elte.txtuml.api.model.Trigger;
import hu.elte.txtuml.examples.printer.PrinterModel.Human;
import hu.elte.txtuml.examples.printer.PrinterModel.PrinterBackend;
import hu.elte.txtuml.examples.printer.PrinterModel.PrinterFrontend;
import hu.elte.txtuml.examples.printer.PrinterModel.PrinterSystem;
import hu.elte.txtuml.examples.printer.PrinterModel.RestockPaper;
import hu.elte.txtuml.examples.printer.PrinterModel.Usage;
import hu.elte.txtuml.examples.printer.PrinterModel.WantToPrint;

import java.util.LinkedList;
import java.util.Queue;

class PrinterModel extends Model
{
	
	// Classes
	
	class PrinterFrontend extends ModelClass
	{
		Queue<Document> queue;
		ModelInt paperCount;
		ModelBool lock;
		
		class Init extends Initial{}
		
		@From(Init.class) @To(AcceptingDocuments.class)
		class Initialize extends Transition
		{
			@Override
			public void effect()
			{
				queue = new LinkedList<Document>();
				lock = ModelBool.FALSE;
			}
		}
		
		class AcceptingDocuments extends State
		{
			@Override
			public void entry()
			{
				Action.If(() -> new ModelBool(queue.size() > 0), () ->
				{
					PrinterBackend pb = PrinterFrontend.this.assoc(PrinterSystem.backend.class)
							.selectAny();
					Action.If(() -> lock.not(), () ->
					{
						lock = ModelBool.TRUE;
						Document doc = queue.peek();
						Action.If(() -> paperCount.isMoreEqual(doc.sideCount).not(), () ->
						{
							Action.send(PrinterFrontend.this, new OutOfPaperSignal());
						}, () ->
						{
							Action.send(pb, new Print(doc));
							paperCount = paperCount.subtract(doc.sideCount);
						});
					});
				});
				
				Action.log("PrinterFrontend: the printer is waiting for documents.");
			}
		}
		
		@From(AcceptingDocuments.class) @To(AcceptingDocuments.class) @Trigger(FinishedPrinting.class)
		class PrintFinished extends Transition
		{
			@Override
			public void effect()
			{
				queue.poll();
				lock = ModelBool.FALSE;
				Action.log("PrinterFrontend: the printing of a document has finished. Remaining: " + queue.size() + ". Papers: " + paperCount + ".");
			}
		}
		
		@From(AcceptingDocuments.class) @To(AcceptingDocuments.class) @Trigger(Print.class)
		class PrintRecieved extends Transition
		{
			@Override
			public void effect()
			{
				queue.add(getSignal(Print.class).Document);
				Action.log("PrinterFrontend: Document recieved. Queue size: " + queue.size() + ".");
			}
		}
		
		@From(AcceptingDocuments.class) @To(OutOfPaper.class) @Trigger(OutOfPaperSignal.class)
		class Error extends Transition{}
		
		class OutOfPaper extends State
		{
			@Override
			public void entry()
			{
				Action.log("PrinterFrontend: the printer is out of paper!");
			}
		}
		
		@From(OutOfPaper.class) @To(AcceptingDocuments.class) @Trigger(RestockPaper.class)
		class Restocking extends Transition
		{
			@Override
			public void effect()
			{
				lock = ModelBool.FALSE;
				paperCount = paperCount.add(getSignal(RestockPaper.class).amount);
				Action.log("PrinterFrontend: restocking paper.");
			}
		}
		
	}
	
	class PrinterBackend extends ModelClass
	{
		Document beingPrinted;
		ModelInt tonerPercent;
		
		class Init extends Initial{}
		
		@From(Init.class) @To(Waiting.class)
		class Initialize extends Transition
		{
			@Override
			public void effect()
			{
				tonerPercent = new ModelInt(100);
			}
		}
		
		class Waiting extends State{}
		
		@From(Waiting.class) @To(Printing.class) @Trigger(Print.class)
		class RecievedJob extends Transition
		{
			@Override
			public ModelBool guard()
			{
				return tonerPercent.isMoreEqual(getSignal(Print.class).Document.sideCount);
			}
			
			@Override
			public void effect()
			{
				beingPrinted = getSignal(Print.class).Document;
			}
		}
		
		@From(Waiting.class) @To(OutOfToner.class) @Trigger(Print.class)
		class RecievedJobError extends Transition
		{
			@Override
			public ModelBool guard()
			{
				return tonerPercent.isMoreEqual(getSignal(Print.class).Document.sideCount).not();
			}
		}
		
		class Printing extends State
		{
			@Override
			public void entry()
			{
				Action.log("PrinterBackend: started printing.");
				Action.For(new ModelInt(1), beingPrinted.sideCount, i ->
				{
					try
					{
						Thread.sleep(2000);
					}
					catch (Exception e)
					{
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
				});
				tonerPercent = tonerPercent.subtract(beingPrinted.sideCount);
				Action.log("PrinterBackend: finished printing.");
				Action.send(PrinterBackend.this, new FinishedPrinting());
			}
		}
		
		@From(Printing.class) @To(Waiting.class) @Trigger(FinishedPrinting.class)
		class FinishedJob extends Transition
		{
			@Override
			public void effect()
			{
				beingPrinted = null;
				PrinterFrontend pf = PrinterBackend.this.assoc(PrinterSystem.frontend.class)
						.selectAny();
				Action.send(pf, new FinishedPrinting());
			}
		}
		
		class OutOfToner extends State
		{
			@Override
			public void entry()
			{
				Action.log("PrinterBackend: out of toner!");
			}
		}
		
	}
	
	class Document extends ModelClass
	{
		ModelInt sideCount;
	}
	
	class Human extends ModelClass
	{
		ModelInt count;
		
		public Human(ModelInt c)
		{
			count = c;
		}
		
		class Init extends Initial{}
		
		class DoPrint extends State
		{
			@Override
			public void entry()
			{
				PrinterFrontend p = Human.this.assoc(Usage.usedPrinter.class)
						.selectAny();
				
				Document doc = Action.create(Document.class);
				doc.sideCount = count;
				
				Action.send(p, new Print(doc));
			}
		}
		
		@From(Init.class) @To(DoPrint.class) @Trigger(WantToPrint.class)
		class Initialize extends Transition{}
		
		@From(DoPrint.class) @To(DoPrint.class) @Trigger(WantToPrint.class)
		class Redo extends Transition{}
	}
	
	// associations
	
	class Usage extends Association
	{
		class usedPrinter extends One<PrinterFrontend>{}
		
		class userOfPrinter extends Many<Human>{}
	}
	
	class PrinterSystem extends Association
	{
		class frontend extends One<PrinterFrontend>{}
		
		class backend extends One<PrinterBackend>{}
	}
	
	// signals
	
	static class WantToPrint extends Signal{}
	
	static class Print extends Signal{
		Document Document;
		
		public Print(Document d)
		{
			Document = d;
		}
	}
	
	static class FinishedPrinting extends Signal{}
	
	static class OutOfPaperSignal extends Signal{}
	
	static class RestockPaper extends Signal
	{
		ModelInt amount;
		
		public RestockPaper(ModelInt am)
		{
			amount = am;
		}
	}
	
	// Signal classes are allowed to be static for simpler use.
	
}

class PrinterTester
{
	
	void test() throws InterruptedException
	{
		ModelExecutor.Settings.setExecutorLog(false);
		
		PrinterFrontend p = Action.create(PrinterFrontend.class);
		PrinterBackend pb = Action.create(PrinterBackend.class);
		p.paperCount = new ModelInt(2);
		
		Human h1 = Action.create(Human.class, new ModelInt(2));
		Human h2 = Action.create(Human.class, new ModelInt(2));
		Human h3 = Action.create(Human.class, new ModelInt(2));
		Human h4 = Action.create(Human.class, new ModelInt(2));
		
		//building links
		Action.link(PrinterSystem.frontend.class, p, 
				PrinterSystem.backend.class, pb);
		Action.link(Usage.usedPrinter.class, p,
				Usage.userOfPrinter.class, h1);
		Action.link(Usage.usedPrinter.class, p,
				Usage.userOfPrinter.class, h2);
		Action.link(Usage.usedPrinter.class, p,
				Usage.userOfPrinter.class, h3);
		Action.link(Usage.usedPrinter.class, p,
				Usage.userOfPrinter.class, h4);
		
		Action.log("Machine and human are starting.");
		Action.start(p);
		Action.start(pb);
		Action.start(h1);
		Action.start(h2);
		Action.start(h3);
		Action.start(h4);
		
		Action.send(h1, new WantToPrint()); //2
		Thread.sleep(500);
		Action.send(h2, new WantToPrint()); //2
		Thread.sleep(500);
		Action.send(h1, new WantToPrint()); //2
		Thread.sleep(500);
		Action.send(h3, new WantToPrint()); //2
		Thread.sleep(500);
		Action.send(h4, new WantToPrint()); //2
		Thread.sleep(500);
		Action.send(h1, new WantToPrint()); //2
		Thread.sleep(2000);
		Action.send(p, new RestockPaper(new ModelInt(20)));
		
		Thread.sleep(24000);
		
		Action.log("Test: pc: " + p.paperCount + ".");
		
		ModelExecutor.shutdown();
	}
	
}

public class Printer
{
	public static void main(String[] args) throws InterruptedException
	{
		new PrinterTester().test();
	}
}